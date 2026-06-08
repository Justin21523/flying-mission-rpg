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

// Camera-relative movement for BOTH modes. "Forward" is derived from the horizontal vector
// from the CAMERA to the PLAYER (i.e. the way the camera is pointing at the player) — using
// positions rather than camera.getWorldDirection() avoids any matrix/quaternion timing lag,
// so W always goes "into the screen / away from camera", A/D strafe, and turning the camera
// turns the controls with it. Vehicle mode is just faster. headingRef tracks the travel
// direction so the mesh faces where it's going.
export function applyMovement(
  b: RapierRigidBody,
  keys: Record<string, boolean>,
  camera: Camera,
  mode: TransformMode,
  headingRef: { current: number },
): void {
  const vel = b.linvel();
  const speed = mode === 'vehicle' ? VEHICLE_SPEED : ROBOT_SPEED;

  // Forward = horizontal direction from camera to player (into the screen).
  const t = b.translation();
  _fwd.set(t.x - camera.position.x, 0, t.z - camera.position.z);
  if (_fwd.lengthSq() < 1e-6) _fwd.set(0, 0, 1);
  _fwd.normalize();
  // Screen-right (kit-proven basis): (-fz, 0, fx).
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

  // Face the travel direction (so the capsule nose / model points where you go).
  if (moving) headingRef.current = Math.atan2(_dir.x, _dir.z);

  // Jump (robot only), only when grounded-ish.
  if (mode === 'robot' && keys['Space'] && Math.abs(vel.y) < 0.05) {
    b.setLinvel({ x: vel.x, y: ROBOT_JUMP, z: vel.z }, true);
  }
}
