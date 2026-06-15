import { useCallback, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Quaternion, Vector3, type Group } from 'three';
import { useCharacterStore } from '../../stores/game/useCharacterStore';
import { getEditorCharacter } from '../../stores/game/editorCharacterStore';
import { useFlightTimelineStore, flightTimelineHandle } from '../../stores/game/flightTimelineStore';
import { getActiveFlightPhase } from '../../stores/game/flightPhaseStore';
import { useGameStore } from '../../stores/game/useGameStore';
import { evaluateFlightState, flightSteerOffset } from './flightPhaseRuntime';
import { flightHandle } from './flightHandle';
import { characterModelForForm } from '../destination/characterModel';
import { AnimatedGlbModel } from '../world/AnimatedGlbModel';
import type { AnimState } from '../anim/animRunner';
import type { GamePhase } from '../../types/game/state';

// Flies the craft along the active Flight Phase's AUTHORED path via the shared flightPhaseRuntime engine — the
// exact data the editor edits, so moving a node changes the real flown route live (no separate play path).
//
// EDIT preview (play=false): the timeline overlay drives currentTime (scrub/play); no input, no steering.
// PLAY (play=true): GUIDED + steer — W/S throttle progress along the path (advances currentTime), A/D steer
// laterally and Space/Shift vertically within the node's influenceRadius corridor. Reaching the end hands off
// to CLOUD_ASCENT (only legal next phase). Camera keyframes + events ride the same currentTime.
const _q = new Quaternion();
const _p = new Vector3();
const poseToAnim: Record<string, Partial<AnimState>> = {
  level: {}, climb: { speed: 0.7 }, dive: { speed: 0.9 }, bankLeft: {}, bankRight: {}, turn: {},
};
const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.min(1, t);
// FSM hand-off when a guided phase finishes (matches GameStateMachine's allowed next phase).
const NEXT_PHASE: Record<string, string> = {
  BASE_FLY_AROUND: 'CLOUD_ASCENT',
  WORLD_FLIGHT: 'DESTINATION_APPROACH',
  RETURN_FLIGHT: 'BASE_APPROACH',
};

export const FlightPhasePreviewController = ({ play = false }: { play?: boolean }) => {
  const craft = useRef<Group>(null);
  const charId = useCharacterStore((s) => s.selectedCharacterId);
  const character = charId ? getEditorCharacter(charId) : undefined;
  const animState = useRef<AnimState>({ flying: true, moving: true, form: 'vehicle', speed: 0.5 });
  const getAnimState = useCallback(() => animState.current, []);
  const keys = useRef<Record<string, boolean>>({});
  const lat = useRef(0); // smoothed lateral steer −1..1
  const vert = useRef(0); // smoothed vertical steer −1..1
  const handedOff = useRef(false);

  // Play: start from the top + listen for flight input (W/S throttle, A/D + Space/Shift steer).
  useEffect(() => {
    if (!play) return;
    useFlightTimelineStore.setState({ currentTime: 0, playing: false });
    handedOff.current = false;
    const down = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      keys.current[e.code] = true;
    };
    const up = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); keys.current = {}; };
  }, [play]);

  useFrame((_, dtRaw) => {
    const c = craft.current;
    if (!c) return;
    const dt = Math.min(dtRaw, 0.05);
    const tl = useFlightTimelineStore.getState();
    const phase = getActiveFlightPhase();
    if (!phase) return;
    if (Math.abs(tl.totalDuration - phase.totalDuration) > 1e-3) tl.setTotalDuration(phase.totalDuration);
    const dur = phase.totalDuration || 0;

    let steerX = 0; let steerY = 0; let steerZ = 0;
    let speedNorm = 0;
    if (play) {
      // throttle → advance currentTime along the path (idle drifts gently so the craft always flies).
      const k = keys.current;
      const throttle = k['KeyW'] ? 1.5 : k['KeyS'] ? -0.6 : 0.3;
      speedNorm = k['KeyW'] ? 0.9 : k['KeyS'] ? 0.1 : 0.35;
      const t = clamp(tl.currentTime + throttle * dt, 0, dur);
      if (t !== tl.currentTime) useFlightTimelineStore.setState({ currentTime: t });
      // steering within the influenceRadius corridor (smoothed).
      const latTarget = (k['KeyD'] || k['ArrowRight'] ? 1 : 0) - (k['KeyA'] || k['ArrowLeft'] ? 1 : 0);
      const vertTarget = (k['Space'] || k['ArrowUp'] ? 1 : 0) - (k['ShiftLeft'] || k['ArrowDown'] ? 1 : 0);
      lat.current = lerp(lat.current, latTarget, 6 * dt);
      vert.current = lerp(vert.current, vertTarget, 6 * dt);
      const off = flightSteerOffset(phase.path, tl.currentTime, lat.current, vert.current);
      steerX = off[0]; steerY = off[1]; steerZ = off[2];
      if (!handedOff.current && dur > 0 && tl.currentTime >= dur - 1e-3) {
        handedOff.current = true;
        const next = NEXT_PHASE[useGameStore.getState().phase];
        if (next) useGameStore.getState().requestTransition(next as GamePhase);
      }
    } else {
      // edit preview — overlay drives playback; just step the clock when playing.
      tl.advance(dt);
    }

    const st = evaluateFlightState(phase.path, useFlightTimelineStore.getState().currentTime);
    _p.set(st.position[0] + steerX, st.position[1] + steerY, st.position[2] + steerZ);
    c.position.copy(_p);
    _q.set(st.quaternion[0], st.quaternion[1], st.quaternion[2], st.quaternion[3]);
    c.quaternion.copy(_q);
    Object.assign(animState.current, poseToAnim[st.pose] ?? {});
    animState.current.speed = speedNorm;

    flightHandle.pos.copy(c.position);
    flightHandle.quat.copy(c.quaternion);
    flightHandle.speedNorm = speedNorm;
    flightHandle.speed = st.speed; // raw units/sec — HUD + speed FX
    flightHandle.throttle = play ? (speedNorm > 0.6 ? 1 : speedNorm < 0.2 ? -1 : 0) : 0;
    flightHandle.routeU = st.u;
    flightHandle.altitude = _p.y;
    flightTimelineHandle.currentTime = useFlightTimelineStore.getState().currentTime;
    flightTimelineHandle.altitude = _p.y;
    flightTimelineHandle.speed = st.speed;
  });

  const fallback = (
    <mesh castShadow>
      <coneGeometry args={[0.7, 2.2, 6]} />
      <meshStandardMaterial color={character?.color ?? '#38bdf8'} />
    </mesh>
  );
  const modelId = characterModelForForm(character, 'plane');
  return (
    <group ref={craft}>
      {modelId ? (
        <AnimatedGlbModel assetId={modelId} animation={character?.flightAnimation} rules={character?.animationRules} getAnimState={getAnimState} fallback={fallback} noCull />
      ) : fallback}
    </group>
  );
};
