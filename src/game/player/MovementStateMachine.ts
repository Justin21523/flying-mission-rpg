import { Vector3 } from 'three';
import type { Camera } from 'three';
import type { RapierRigidBody } from '@react-three/rapier';
import type { TransformMode } from '../../stores/transformationStore';

const ROBOT_SPEED  = 6;
const ROBOT_JUMP   = 5.5;
const VEHICLE_SPEED = 11;
const VEHICLE_TURN  = 2.2; // radians/sec

// Module-level reusable vectors — no per-frame allocations.
const _fwd = new Vector3();
const _dir = new Vector3();

export function applyMovement(
  b: RapierRigidBody,
  keys: Record<string, boolean>,
  camera: Camera,
  mode: TransformMode,
  headingRef: { current: number },
  dt: number,
): void {
  const vel = b.linvel();
  if (mode === 'robot') {
    camera.getWorldDirection(_fwd);
    _fwd.y = 0;
    _fwd.normalize();
    const rx = _fwd.z, rz = -_fwd.x;
    let mx = 0, mz = 0;
    if (keys['KeyW']) mz += 1;
    if (keys['KeyS']) mz -= 1;
    if (keys['KeyD']) mx += 1;
    if (keys['KeyA']) mx -= 1;
    _dir.set(_fwd.x * mz + rx * mx, 0, _fwd.z * mz + rz * mx);
    if (_dir.lengthSq() > 0) _dir.normalize();
    b.setLinvel({ x: _dir.x * ROBOT_SPEED, y: vel.y, z: _dir.z * ROBOT_SPEED }, true);
    if (keys['Space'] && Math.abs(vel.y) < 0.05)
      b.setLinvel({ x: vel.x, y: ROBOT_JUMP, z: vel.z }, true);
  } else {
    if (keys['KeyA']) headingRef.current += VEHICLE_TURN * dt;
    if (keys['KeyD']) headingRef.current -= VEHICLE_TURN * dt;
    const throttle = keys['KeyW'] ? 1 : keys['KeyS'] ? -1 : 0;
    const vx = Math.sin(headingRef.current) * throttle * VEHICLE_SPEED;
    const vz = Math.cos(headingRef.current) * throttle * VEHICLE_SPEED;
    b.setLinvel({ x: vx, y: vel.y, z: vz }, true);
  }
}
