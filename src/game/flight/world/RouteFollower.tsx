import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, type Group } from 'three';
import { useCharacterStore } from '../../../stores/game/useCharacterStore';
import { getEditorCharacter } from '../../../stores/game/editorCharacterStore';
import { getFlightTuning, useEditorFlightStore } from '../../../stores/game/editorFlightStore';
import { getPath } from '../../../stores/editorPathStore';
import { getCurve, samplePos, sampleTangent } from '../../path/pathCurve';
import { getActivePathId } from './worldRoute';
import { worldFlightDev } from './worldFlightDev';
import { useWorldFlightRuntimeStore } from '../../../stores/game/worldFlightRuntimeStore';
import { useGameStore } from '../../../stores/game/useGameStore';
import { AnimatedGlbModel } from '../../world/AnimatedGlbModel';
import { flightHandle } from '../flightHandle';

// The craft cruises FORWARD along the active route's 航道 (editorPathStore path) — it always flies ahead
// (never reverses); W boosts, S eases off. NOTE: three's Object3D.lookAt on a non-camera Group points its
// +Z at the target, but the FlightCamera (and free-flight) treat −Z as forward — so we aim lookAt at
// (pos − tangent) to make the craft's −Z follow the route. Then the camera trails BEHIND and the world
// streams backward past it (no more inversion). The model's facing offset is editable (🛩 Flight → Craft yaw).
const _pos = new Vector3();
const _tan = new Vector3();
const _right = new Vector3();
const _look = new Vector3();
const DEG2RAD = Math.PI / 180;
const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.min(1, t);
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

export const RouteFollower = () => {
  const craft = useRef<Group>(null);
  const keys = useRef<Record<string, boolean>>({});
  const u = useRef(0);
  const lateral = useRef(0); // A/D offset from the route centreline
  const vert = useRef(0); // ↑/↓ offset
  const bank = useRef(0); // bank-into-turn roll
  const charId = useCharacterStore((s) => s.selectedCharacterId);
  const character = charId ? getEditorCharacter(charId) : undefined;
  const craftYaw = useEditorFlightStore((s) => s.tuning.worldCraftYawDeg);
  const pathId = getActivePathId();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      keys.current[e.code] = true;
    };
    const up = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      keys.current = {};
    };
  }, []);

  useEffect(() => {
    u.current = 0;
    flightHandle.routeU = 0;
    useWorldFlightRuntimeStore.getState().reset();
  }, []);

  useFrame((_, dtRaw) => {
    const c = craft.current;
    if (!c) return;
    const def = getPath(pathId);
    const cc = def ? getCurve(def) : null;
    if (!cc) return;
    const dt = Math.min(dtRaw, 0.05);
    const tuning = getFlightTuning();
    const speedMult = character ? character.stats.flightSpeed / 6 : 1;
    const k = keys.current;
    // Always cruise forward — W boosts, S eases off (never reverses).
    const boost = k['KeyW'] ? 1.7 : k['KeyS'] ? 0.45 : 1;
    const pathSpeed = tuning.cruiseSpeed * speedMult * boost;
    u.current = Math.min(1, u.current + (pathSpeed * dt) / Math.max(1, cc.length));
    // Dev jumps (WorldFlightDebugPanel): snap / advance route progress.
    if (worldFlightDev.jumpU >= 0) { u.current = Math.min(1, worldFlightDev.jumpU); worldFlightDev.jumpU = -1; }
    if (worldFlightDev.progressDelta !== 0) { u.current = Math.min(1, u.current + worldFlightDev.progressDelta); worldFlightDev.progressDelta = 0; }

    samplePos(cc.curve, u.current, _pos);
    sampleTangent(cc.curve, u.current, _tan);

    // Steering — A/D drift the craft laterally off the route centreline (with bank-into-turn roll),
    // Space/Shift (or ↑/↓) climb/descend. The offsets INTEGRATE while held (continuous — keep going up to a
    // generous max) and HOLD on release (no snap-back). Keeps the craft parallel to the route.
    const steerIn = (k['KeyD'] || k['ArrowRight'] ? 1 : 0) - (k['KeyA'] || k['ArrowLeft'] ? 1 : 0);
    const vertIn = (k['Space'] || k['ArrowUp'] ? 1 : 0) - (k['ShiftLeft'] || k['ShiftRight'] || k['ArrowDown'] ? 1 : 0);
    const sr = tuning.worldSteerRange;
    const vr = tuning.worldVertRange;
    lateral.current = clamp(lateral.current + steerIn * tuning.worldSteerSpeed * dt, -sr, sr);
    vert.current = clamp(vert.current + vertIn * tuning.worldVertSpeed * dt, -vr, vr);
    bank.current = lerp(bank.current, -steerIn * tuning.worldBankDeg * DEG2RAD, tuning.worldSteerSmooth * 1.5 * dt);

    _right.set(-_tan.z, 0, _tan.x).normalize(); // horizontal right of travel
    _pos.addScaledVector(_right, lateral.current);
    _pos.y += vert.current;

    flightHandle.pos.copy(_pos);
    c.position.copy(_pos);
    _look.copy(_pos).sub(_tan); // non-camera lookAt points +Z at target → aim behind so −Z = forward
    c.lookAt(_look);
    c.rotateZ(bank.current); // roll around the forward axis → bank into the turn
    flightHandle.quat.copy(c.quaternion);
    flightHandle.speed = pathSpeed;
    flightHandle.altitude = _pos.y;
    flightHandle.routeU = u.current;
    flightHandle.throttle = k['KeyW'] ? 1 : k['KeyS'] ? -1 : 0;

    if (u.current >= 0.999 && !useWorldFlightRuntimeStore.getState().arrived) {
      useWorldFlightRuntimeStore.getState().setArrived(true);
      // Reached the destination → hand off to the approach phase (full descent/landing is Batch 7).
      useGameStore.getState().requestTransition('DESTINATION_APPROACH');
    }
  });

  const fallback = (
    <mesh castShadow>
      <coneGeometry args={[0.7, 2.2, 6]} />
      <meshStandardMaterial color={character?.color ?? '#38bdf8'} />
    </mesh>
  );
  return (
    <group ref={craft}>
      {/* editable facing offset so the model's nose points along travel (default 180°; dial in 🛩 Flight). */}
      <group rotation={[0, craftYaw * DEG2RAD, 0]}>
        {character?.modelAssetId ? <AnimatedGlbModel assetId={character.modelAssetId} animation={character.flightAnimation} fallback={fallback} noCull /> : fallback}
      </group>
    </group>
  );
};
