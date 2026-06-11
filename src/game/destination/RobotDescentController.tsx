import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, type Group } from 'three';
import { usePlayerStore } from '../../stores/playerStore';
import { useGameStore } from '../../stores/game/useGameStore';
import { useCharacterStore } from '../../stores/game/useCharacterStore';
import { getEditorCharacter } from '../../stores/game/editorCharacterStore';
import { getDestinationParts, getDestinationByKind } from '../../stores/game/editorDestinationStore';
import { useDestinationRuntimeStore } from '../../stores/game/destinationRuntimeStore';
import { AnimatedGlbModel } from '../world/AnimatedGlbModel';
import { descentEntry } from '../transformation/descentEntry';
import { evaluateLanding, type LandingZoneInput } from './safeLanding';
import { robotHandle } from './robotHandle';
import { groundCharacterScale } from './groundCharacterScale';
import { DESTINATION_BOUNDARY_HALF } from '../../data/game/destinationLayout';

// DESCENT — the robot-form character falls from the air spawn toward the harbor. Camera-relative W/S/A/D
// horizontal control, Shift = thrusters (steady slow descent), Space = buffer burst; gravity pulls toward a
// terminal speed seeded by the transformation's momentum hand-off. On ground contact the pure
// SafeLandingEvaluator decides: safe/rough → LANDING; unsafe → soft bounce back up with reasons (no crash).
const GRAVITY = 7;
const MAX_FALL = 16;
const THRUSTER_FALL = 3.2; // Shift steady descent speed
const BURST_IMPULSE = 9; // Space upward buffer
const H_ACCEL = 26;
const H_DRAG = 3.5;
const H_MAX = 12;
const GROUND_Y = 0.6;

const _fwd = new Vector3();
const _h = new Vector3();

export const RobotDescentController = () => {
  const group = useRef<Group>(null);
  const keys = useRef<Record<string, boolean>>({});
  const vel = useRef(new Vector3(0, -8, 0));
  const burstCd = useRef(0);
  const { camera } = useThree();
  const charId = useCharacterStore((s) => s.selectedCharacterId);
  const character = charId ? getEditorCharacter(charId) : undefined;

  useEffect(() => {
    // start at the editable air-spawn part, falling with the transformation's momentum
    const sp = getDestinationByKind('spawn_air');
    const p = sp ? sp.position : [0, 80, 0];
    robotHandle.pos.set(p[0], p[1], p[2]);
    vel.current.set(0, -Math.max(4, descentEntry.velocity), 0);
    useDestinationRuntimeStore.getState().setEvaluation(null);

    const down = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      keys.current[e.code] = true;
    };
    const up = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      keys.current = {};
    };
  }, []);

  useFrame((_, dtRaw) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(dtRaw, 0.05);
    const k = keys.current;
    const pos = robotHandle.pos;
    const v = vel.current;

    // camera-relative horizontal input
    _fwd.set(pos.x - camera.position.x, 0, pos.z - camera.position.z);
    if (_fwd.lengthSq() < 1e-6) _fwd.set(0, 0, 1);
    _fwd.normalize();
    const rx = -_fwd.z, rz = _fwd.x;
    const mz = (k['KeyW'] ? 1 : 0) - (k['KeyS'] ? 1 : 0);
    const mx = (k['KeyD'] ? 1 : 0) - (k['KeyA'] ? 1 : 0);
    v.x += (_fwd.x * mz + rx * mx) * H_ACCEL * dt;
    v.z += (_fwd.z * mz + rz * mx) * H_ACCEL * dt;
    v.x -= v.x * H_DRAG * dt;
    v.z -= v.z * H_DRAG * dt;
    _h.set(v.x, 0, v.z);
    if (_h.length() > H_MAX) { _h.setLength(H_MAX); v.x = _h.x; v.z = _h.z; }

    // vertical: thrusters (Shift) hold a steady slow fall; Space gives a short upward buffer
    const thrusters = !!k['ShiftLeft'] || !!k['ShiftRight'];
    burstCd.current = Math.max(0, burstCd.current - dt);
    if (k['Space'] && burstCd.current <= 0) { v.y += BURST_IMPULSE; burstCd.current = 0.8; }
    if (thrusters) v.y = Math.max(v.y, -THRUSTER_FALL) + (v.y < -THRUSTER_FALL ? 14 * dt : 0);
    v.y -= GRAVITY * dt;
    if (v.y < -MAX_FALL) v.y = -MAX_FALL;

    pos.addScaledVector(v, dt);

    // boundary clamp (editable boundary part half-extents)
    const boundary = getDestinationByKind('boundary');
    const bx = boundary ? boundary.size[0] : DESTINATION_BOUNDARY_HALF;
    const bz = boundary ? boundary.size[2] : DESTINATION_BOUNDARY_HALF;
    pos.x = Math.max(-bx, Math.min(bx, pos.x));
    pos.z = Math.max(-bz, Math.min(bz, pos.z));

    // publish
    robotHandle.vSpeed = -v.y;
    robotHandle.hSpeed = Math.hypot(v.x, v.z);
    robotHandle.altitude = pos.y;
    robotHandle.thrusters = thrusters;
    g.position.copy(pos);
    g.rotation.z = -v.x * 0.02;
    g.rotation.x = v.z * 0.02;
    usePlayerStore.getState().setPosition({ x: pos.x, y: pos.y, z: pos.z });

    // touchdown → evaluate
    if (pos.y <= GROUND_Y && v.y <= 0) {
      const zones: LandingZoneInput[] = getDestinationParts()
        .filter((p) => p.enabled && (p.kind === 'landing_zone' || p.kind === 'safe_zone'))
        .map((p) => ({ id: p.id, x: p.position[0], z: p.position[2], radius: p.radius ?? Math.max(p.size[0], p.size[2]) / 2, kind: p.kind as LandingZoneInput['kind'] }));
      const evaluation = evaluateLanding({
        x: pos.x, z: pos.z, verticalSpeed: -v.y, horizontalSpeed: robotHandle.hSpeed,
        zones, boundaryHalf: { x: bx, z: bz },
      });
      useDestinationRuntimeStore.getState().setEvaluation(evaluation);
      if (evaluation.safe) {
        pos.y = GROUND_Y;
        v.set(0, 0, 0);
        useGameStore.getState().requestTransition('LANDING');
      } else {
        // recoverable: soft bounce back to a safe height, keep the reasons on the HUD
        pos.y = GROUND_Y + 0.2;
        v.set(v.x * 0.3, 9, v.z * 0.3);
      }
    }
  });

  const fallback = (
    <mesh castShadow>
      <boxGeometry args={[0.8, 1.2, 0.6]} />
      <meshStandardMaterial color={character?.color ?? '#38bdf8'} />
    </mesh>
  );
  return (
    <group ref={group} scale={groundCharacterScale(character)}>
      {character?.modelAssetId ? <AnimatedGlbModel assetId={character.modelAssetId} fallback={fallback} noCull /> : fallback}
    </group>
  );
};
