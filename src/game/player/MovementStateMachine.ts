import { Vector3 } from 'three';
import type { Camera } from 'three';
import type { RapierRigidBody } from '@react-three/rapier';
import type { TransformMode } from '../../stores/transformationStore';

const ROBOT_SPEED = 6;
const ROBOT_JUMP = 5.5;
const VEHICLE_SPEED = 11;

// Module-level reusable vectors — no per-frame allocations.
const _fwd = new Vector3();
const _dir = new Vector3();

// Camera-relative movement for BOTH modes: W always goes the way the camera faces, A/D strafe
// left/right of the camera, so turning the camera turns the controls with it (standard
// third-person feel — never world-axis locked). Vehicle mode is just faster. headingRef tracks
// the current movement direction so the mesh can face where it's going.
export function applyMovement(
  b: RapierRigidBody,
  keys: Record<string, boolean>,
  camera: Camera,
  mode: TransformMode,
  headingRef: { current: number },
): void {
  const vel = b.linvel();
  const speed = mode === 'vehicle' ? VEHICLE_SPEED : ROBOT_SPEED;

  // Camera forward projected onto the ground plane.
  camera.getWorldDirection(_fwd);
  _fwd.y = 0;
  _fwd.normalize();
  // Right vector = forward × up (three.js is right-handed).
  const rx = -_fwd.z;
  const rz = _fwd.x;

  let mx = 0, mz = 0;
  if (keys['KeyW']) mz += 1;
  if (keys['KeyS']) mz -= 1;
  if (keys['KeyD']) mx += 1;
  if (keys['KeyA']) mx -= 1;

  _dir.set(_fwd.x * mz + rx * mx, 0, _fwd.z * mz + rz * mx);
  const moving = _dir.lengthSq() > 0;
  if (moving) _dir.normalize();

  b.setLinvel({ x: _dir.x * speed, y: vel.y, z: _dir.z * speed }, true);

  // Face the movement direction (so the capsule's nose / any model points where you go).
  if (moving) headingRef.current = Math.atan2(_dir.x, _dir.z);

  // Jump (robot only), only when grounded-ish.
  if (mode === 'robot' && keys['Space'] && Math.abs(vel.y) < 0.05) {
    b.setLinvel({ x: vel.x, y: ROBOT_JUMP, z: vel.z }, true);
  }
}
