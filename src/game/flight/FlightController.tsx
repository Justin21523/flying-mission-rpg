import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Euler, Vector3, type Group } from 'three';
import { useGameStore } from '../../stores/game/useGameStore';
import { useCharacterStore } from '../../stores/game/useCharacterStore';
import { getEditorCharacter } from '../../stores/game/editorCharacterStore';
import { getFlightTuning, useEditorFlightStore } from '../../stores/game/editorFlightStore';
import { useFlightRuntimeStore } from '../../stores/game/flightRuntimeStore';
import { getExteriorByKind } from '../../stores/game/editorExteriorStore';
import { getPath } from '../../stores/editorPathStore';
import { getCurve, samplePos, sampleTangent } from '../path/pathCurve';
import { FLIGHT_PATH_ID } from '../../data/game/flightPath';
import { AnimatedGlbModel } from '../world/AnimatedGlbModel';
import { flightHandle } from './flightHandle';
import { nextSpeed, isStalling } from './flightModel';

// First flight system. Arcade-smooth, euler-integrated (pitch clamped, roll auto-levels) so the craft can
// never flip/loop out of control. Character stats drive speed/turn. Reads live-editable tuning + navpoints.
// Mounted only during flight phases. No Rapier — free flight is pure integration for the best feel.
const SINK_RATE = 7;
const MIN_ALT = 6;

const _fwd = new Vector3();
const _euler = new Euler(0, 0, 0, 'YXZ');
const _pos = new Vector3();
const _tan = new Vector3();
const _look = new Vector3();
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.min(1, t);

export const FlightController = () => {
  const aircraft = useRef<Group>(null);
  const keys = useRef<Record<string, boolean>>({});
  const rot = useRef({ pitch: 0, yaw: 0, roll: 0 });
  const angVel = useRef({ pitch: 0, yaw: 0, roll: 0 });
  const speed = useRef(0);
  const launchT = useRef(0);
  const pathU = useRef(0);
  const blendT = useRef(1); // tunnel→fly-around shoot-out blend (1 = not blending)
  const carry = useRef(new Vector3()); // straight-ahead carry position during the shoot-out
  const carrySpeed = useRef(0);
  const prevPhase = useRef('');
  const charId = useCharacterStore((s) => s.selectedCharacterId);
  const character = charId ? getEditorCharacter(charId) : undefined;
  const craftYaw = useEditorFlightStore((s) => s.tuning.worldCraftYawDeg);

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

  // Spawn at the editable flight-spawn marker.
  useEffect(() => {
    const sp = getExteriorByKind('flight_spawn');
    const p = sp ? sp.position : [0, 26, 60];
    flightHandle.pos.set(p[0], p[1], p[2]);
    rot.current = { pitch: 0, yaw: 0, roll: 0 };
    speed.current = getFlightTuning().cruiseSpeed * 0.6;
  }, []);

  useFrame((_, dtRaw) => {
    const craft = aircraft.current;
    if (!craft) return;
    const dt = Math.min(dtRaw, 0.05);
    const phase = useGameStore.getState().phase;
    const tuning = getFlightTuning();
    const mode = useFlightRuntimeStore.getState().mode;
    const speedMult = character ? character.stats.flightSpeed / 6 : 1;
    const turnMult = character ? character.stats.agility / 6 : 1;

    // ── phase edges ──
    if (phase !== prevPhase.current) {
      if (phase === 'LAUNCH_TUNNEL') {
        launchT.current = 0;
        const sp = getExteriorByKind('flight_spawn');
        const p = sp ? sp.position : [0, 26, 60];
        // start inside the tunnel, behind the exit, flying toward it (+z behind → nose -z).
        flightHandle.pos.set(p[0], p[1], p[2] + tuning.launchTunnelLength);
        rot.current = { pitch: 0, yaw: 0, roll: 0 };
        speed.current = tuning.cruiseSpeed * speedMult * 0.5;
      } else if (phase === 'BASE_FLY_AROUND') {
        pathU.current = 0; // start of the guided flight path
        // Shoot-out: keep flying straight out of the tunnel at exit speed, blending onto the path.
        blendT.current = prevPhase.current === 'LAUNCH_TUNNEL' ? 0 : 1;
        carry.current.copy(flightHandle.pos);
        carrySpeed.current = Math.max(flightHandle.speed, tuning.cruiseSpeed * speedMult);
      }
      prevPhase.current = phase;
    }

    // LAUNCH_TUNNEL — parametric in-tunnel sprint: the craft accelerates through the FULL (editable)
    // tunnel length over the FULL (editable) duration and pops out exactly at the end — the whole launch
    // happens INSIDE the tunnel (no after-exit wait before the fly-around).
    if (phase === 'LAUNCH_TUNNEL') {
      const sp = getExteriorByKind('flight_spawn');
      const p = sp ? sp.position : [0, 26, 60];
      const dur = Math.max(0.5, tuning.launchDurationSec);
      launchT.current += dt;
      const t = clamp(launchT.current / dur, 0, 1);
      const ease = t * t; // accelerating sprint
      flightHandle.pos.set(p[0], p[1], p[2] + tuning.launchTunnelLength * (1 - ease));
      _euler.set(0, 0, 0);
      flightHandle.quat.setFromEuler(_euler);
      flightHandle.speed = (2 * t * tuning.launchTunnelLength) / dur; // d/dt of the eased distance
      flightHandle.speedNorm = t; // camera FOV/pullback ramps with the sprint
      flightHandle.throttle = 1;
      flightHandle.altitude = flightHandle.pos.y;
      craft.position.copy(flightHandle.pos);
      craft.quaternion.copy(flightHandle.quat);
      speed.current = Math.max(tuning.cruiseSpeed * speedMult, flightHandle.speed * 0.5); // hand-off speed
      if (t >= 1) useGameStore.getState().requestTransition('BASE_FLY_AROUND');
      return;
    }

    // Guided fly-around + ascent — auto-follow the editable flight path (hold W to advance; reuses POLI's
    // CatmullRom path). Locked to the curve + faces the tangent; the 3rd-person FlightCamera follows.
    if (phase === 'BASE_FLY_AROUND' || phase === 'CLOUD_ASCENT') {
      const def = getPath(FLIGHT_PATH_ID);
      const cc = def ? getCurve(def) : null;
      if (cc) {
        const kk = keys.current;
        const fwd = kk['KeyW'] ? 1 : kk['KeyS'] ? -0.6 : 0.2; // hold forward → advance; idle drifts slowly
        const pathSpeed = tuning.cruiseSpeed * speedMult * (kk['KeyW'] ? 1.4 : 1);
        pathU.current = clamp(pathU.current + (fwd * pathSpeed * dt) / Math.max(1, cc.length), 0, 1);
        samplePos(cc.curve, pathU.current, _pos);
        sampleTangent(cc.curve, pathU.current, _tan);
        // Shoot-out blend: continue straight out of the tunnel (nose −z) and smooth-step onto the path,
        // so the craft visibly bursts out before banking into the circle.
        if (blendT.current < 1) {
          blendT.current = Math.min(1, blendT.current + dt / 1.2);
          const bk = blendT.current * blendT.current * (3 - 2 * blendT.current);
          carry.current.z -= carrySpeed.current * dt;
          carrySpeed.current = lerp(carrySpeed.current, pathSpeed, 1.2 * dt);
          _pos.multiplyScalar(bk).addScaledVector(carry.current, 1 - bk);
        }
        flightHandle.pos.copy(_pos);
        craft.position.copy(_pos);
        _look.copy(_pos).sub(_tan); // non-camera lookAt points +Z at target → aim behind so −Z = forward
        craft.lookAt(_look);
        flightHandle.quat.copy(craft.quaternion);
        flightHandle.speed = pathSpeed * Math.abs(fwd);
        flightHandle.speedNorm = kk['KeyW'] ? 0.9 : kk['KeyS'] ? 0.1 : 0.35; // camera feel (boost-based)
        flightHandle.throttle = kk['KeyW'] ? 1 : kk['KeyS'] ? -1 : 0;
        flightHandle.altitude = _pos.y;
        if (phase === 'BASE_FLY_AROUND' && _pos.y > 40) useGameStore.getState().requestTransition('CLOUD_ASCENT');
        // Reaching the end of the ascent path (the Sky Gate) hands off to the long-distance world flight.
        if (phase === 'CLOUD_ASCENT' && pathU.current >= 0.985) useGameStore.getState().requestTransition('WORLD_FLIGHT');
        return;
      }
    }

    // ── input ── (free flight — the tunnel is handled parametrically above)
    const k = keys.current;
    const throttle = k['KeyW'] ? 1 : k['KeyS'] ? -1 : 0;
    const pitchIn = (k['ArrowUp'] || k['Space'] ? 1 : 0) - (k['ArrowDown'] || k['ShiftLeft'] ? 1 : 0);
    const turnIn = (k['KeyA'] || k['ArrowLeft'] ? 1 : 0) - (k['KeyD'] || k['ArrowRight'] ? 1 : 0);
    const rollIn = mode === 'advanced' ? (k['KeyQ'] ? 1 : 0) - (k['KeyE'] ? 1 : 0) : 0;

    // ── speed ──
    speed.current = nextSpeed(speed.current, throttle, tuning, speedMult, dt);

    // ── angular (smoothed) ──
    const av = angVel.current;
    av.pitch = lerp(av.pitch, pitchIn * tuning.pitchRate * turnMult, tuning.turnSmooth * dt);
    av.yaw = lerp(av.yaw, turnIn * tuning.yawRate * turnMult, tuning.turnSmooth * dt);
    av.roll = lerp(av.roll, rollIn * tuning.rollRate * turnMult, tuning.turnSmooth * dt);

    const r = rot.current;
    r.yaw += av.yaw * dt;
    r.pitch = clamp(r.pitch + av.pitch * dt, -1.1, 1.1); // clamp → never loops/flips
    if (mode === 'advanced') {
      r.roll = clamp(r.roll + av.roll * dt, -1.0, 1.0);
      if (rollIn === 0) r.roll = lerp(r.roll, 0, tuning.autoLevel * dt); // auto-level
    } else {
      // simple: bank into the turn, auto-level otherwise
      r.roll = lerp(r.roll, -turnIn * 0.45, tuning.autoLevel * dt);
    }

    _euler.set(r.pitch, r.yaw, r.roll);
    flightHandle.quat.setFromEuler(_euler);

    // ── translate along the nose ──
    _fwd.set(0, 0, -1).applyQuaternion(flightHandle.quat);
    flightHandle.pos.addScaledVector(_fwd, speed.current * dt);

    // stall → sink
    if (isStalling(speed.current, tuning, speedMult)) flightHandle.pos.y -= SINK_RATE * dt;

    // ── boundary + altitude recovery (never lose control) ──
    const dxz = Math.hypot(flightHandle.pos.x, flightHandle.pos.z);
    if (dxz > tuning.boundaryRadius) {
      const back = Math.atan2(-flightHandle.pos.x, -flightHandle.pos.z); // yaw toward centre (nose -z)
      r.yaw = lerp(r.yaw, back, 1.5 * dt);
      const s = tuning.boundaryRadius / dxz;
      flightHandle.pos.x *= s;
      flightHandle.pos.z *= s;
    }
    if (flightHandle.pos.y < MIN_ALT) {
      flightHandle.pos.y = lerp(flightHandle.pos.y, MIN_ALT, 3 * dt);
      r.pitch = lerp(r.pitch, 0.2, 2 * dt);
    }

    flightHandle.speed = speed.current;
    flightHandle.speedNorm = clamp(speed.current / Math.max(1, tuning.maxSpeed * speedMult), 0, 1);
    flightHandle.throttle = throttle;
    flightHandle.altitude = flightHandle.pos.y;
    craft.position.copy(flightHandle.pos);
    craft.quaternion.copy(flightHandle.quat);
  });

  return (
    <group ref={aircraft}>
      {/* editable facing offset so the model's nose points along travel (default 180°; 🛩 Flight → Craft yaw). */}
      <group rotation={[0, (craftYaw * Math.PI) / 180, 0]}>
        {character?.modelAssetId ? (
          <AnimatedGlbModel
            assetId={character.modelAssetId}
            animation={character.flightAnimation}
            noCull
            fallback={
              <mesh castShadow>
                <coneGeometry args={[0.6, 2, 6]} />
                <meshStandardMaterial color={character?.color ?? '#38bdf8'} />
              </mesh>
            }
          />
        ) : (
          <mesh castShadow>
            <coneGeometry args={[0.6, 2, 6]} />
            <meshStandardMaterial color={character?.color ?? '#38bdf8'} />
          </mesh>
        )}
      </group>
    </group>
  );
};
