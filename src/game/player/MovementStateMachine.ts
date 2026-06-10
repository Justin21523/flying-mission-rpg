import { Vector3 } from 'three';
import type { Camera } from 'three';
import type { RapierRigidBody } from '@react-three/rapier';
import type { PoliForm } from '../../stores/transformStore';
import { playerMotion } from './playerMotion';

const SPEED = 7;
const SPRINT_MULT = 1.8;   // Shift dash while moving
const FLY_V = 6;           // vertical ascend/descend speed while flying
const VEHICLE_ACCEL = 10;  // how fast the car reaches target velocity
const VEHICLE_DECEL = 4;   // slower → coast/brake feel on release
const SKID_SPEED = 3;      // horizontal speed above which braking leaves skid marks

// Module-level reusable vectors — no per-frame allocations.
const _fwd = new Vector3();
const _dir = new Vector3();

const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.min(1, t);

// Camera-relative movement. "Forward" = horizontal direction from CAMERA to PLAYER (positions, not
// getWorldDirection, to avoid matrix lag), so W goes into the screen, A/D strafe, turning the camera
// turns the controls. headingRef tracks the travel direction so the mesh faces where it goes.
//
// flying (Helly): horizontal camera-relative + Space up / ShiftLeft down / hover; no jump.
// vehicle (car): momentum — velocity lerps toward target (fast accel, slow decel) so releasing keys
//   coasts/brakes and leaves skid marks; S reverses. robot: snappy (instant velocity).
// Shift dashes (×SPRINT_MULT) whenever held while moving.
export function applyMovement(
  b: RapierRigidBody,
  keys: Record<string, boolean>,
  camera: Camera,
  headingRef: { current: number },
  flying: boolean,
  form: PoliForm,
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
  if (moving) headingRef.current = Math.atan2(_dir.x, _dir.z);

  const sprint = keys['ShiftLeft'] && moving ? SPRINT_MULT : 1;
  // speedMult = speed_boost ability; superMult = super-boost mode; surfaceSpeedMult = ground surface (all 1 by default).
  const speed = SPEED * sprint * playerMotion.speedMult * playerMotion.superMult * playerMotion.surfaceSpeedMult;

  if (flying) {
    // Shift+WASD = horizontal sprint (no descend); Shift ALONE (no move key) = descend; Space = ascend.
    const vy = keys['Space'] ? FLY_V : (keys['ShiftLeft'] && !moving) ? -FLY_V : 0;
    b.setLinvel({ x: _dir.x * speed, y: vy, z: _dir.z * speed }, true);
    playerMotion.skidding = false;
    playerMotion.speed = Math.hypot(_dir.x * speed, _dir.z * speed);
    return;
  }

  if (form === 'vehicle') {
    // Momentum: ease current horizontal velocity toward the target.
    const targetX = _dir.x * speed;
    const targetZ = _dir.z * speed;
    const dt = 1 / 60;
    // Surface modulates responsiveness: accel × surfaceAccelMult, decel × surfaceBrakeMult (low brake = slidey, e.g. ice).
    const rate = (moving ? VEHICLE_ACCEL * playerMotion.surfaceAccelMult : VEHICLE_DECEL * playerMotion.surfaceBrakeMult);
    const nx = lerp(vel.x, targetX, rate * dt);
    const nz = lerp(vel.z, targetZ, rate * dt);
    b.setLinvel({ x: nx, y: vel.y, z: nz }, true);
    const spd = Math.hypot(nx, nz);
    playerMotion.speed = spd;
    // Skid when braking/coasting at speed (not actively accelerating forward).
    playerMotion.skidding = !moving && spd > SKID_SPEED;
    return;
  }

  // Robot: snappy instant velocity.
  b.setLinvel({ x: _dir.x * speed, y: vel.y, z: _dir.z * speed }, true);
  playerMotion.speed = Math.hypot(_dir.x * speed, _dir.z * speed);
  playerMotion.skidding = false;
}
