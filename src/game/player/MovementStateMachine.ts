import { Vector3 } from 'three';
import type { Camera } from 'three';
import type { RapierRigidBody } from '@react-three/rapier';

const SPEED = 7;
const JUMP = 5.5;

// Module-level reusable vectors — no per-frame allocations.
const _fwd = new Vector3();
const _dir = new Vector3();

// Camera-relative movement. "Forward" is the horizontal direction from the CAMERA to the PLAYER
// (using positions, not camera.getWorldDirection, to avoid matrix/quaternion timing lag), so W
// always goes into the screen, A/D strafe, and turning the camera turns the controls with it.
// headingRef tracks the travel direction so the visible mesh can face where it's going.
export function applyMovement(
  b: RapierRigidBody,
  keys: Record<string, boolean>,
  camera: Camera,
  headingRef: { current: number },
): void {
  const vel = b.linvel();

  const t = b.translation();
  _fwd.set(t.x - camera.position.x, 0, t.z - camera.position.z);
  if (_fwd.lengthSq() < 1e-6) _fwd.set(0, 0, 1);
  _fwd.normalize();
  const rx = -_fwd.z; // screen-right
  const rz = _fwd.x;

  let mx = 0, mz = 0;
  if (keys['KeyW']) mz += 1;
  if (keys['KeyS']) mz -= 1;
  if (keys['KeyD']) mx += 1;
  if (keys['KeyA']) mx -= 1;

  _dir.set(_fwd.x * mz + rx * mx, 0, _fwd.z * mz + rz * mx);
  const moving = _dir.lengthSq() > 0;
  if (moving) _dir.normalize();

  b.setLinvel({ x: _dir.x * SPEED, y: vel.y, z: _dir.z * SPEED }, true);

  if (moving) headingRef.current = Math.atan2(_dir.x, _dir.z);

  if (keys['Space'] && Math.abs(vel.y) < 0.05) {
    b.setLinvel({ x: vel.x, y: JUMP, z: vel.z }, true);
  }
}
