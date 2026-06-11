// Per-phase third-person follow-camera framing (authored in Edit Mode, applied by FollowCamera in Play).
// It sets the orbit distance / yaw / pitch / fov + the look-target height above the followed subject — the
// camera stays a user-controllable third-person follow (drag still adjusts within the phase; never locked).
export interface PhaseCameraConfig {
  distance: number;
  yawDeg: number; // orbit yaw around the subject
  pitchDeg: number; // 0 = top-down, 90 = horizon (matches FollowCamera's cos(pitch) height term)
  fov: number;
  targetHeight: number; // look-at point height above the subject
}

export const DEFAULT_PHASE_CAMERA: PhaseCameraConfig = {
  distance: 9,
  yawDeg: 180,
  pitchDeg: 51.6, // ≈ DEFAULT_PITCH 0.9 rad
  fov: 50,
  targetHeight: 1.0,
};

interface Vec { x: number; y: number; z: number }
const RAD2DEG = 180 / Math.PI;
const DEG2RAD = Math.PI / 180;

// Recover a follow config from a concrete camera position + look target (the "capture current view" button).
// Inverse of cameraOffsetFromConfig: pitch from the vertical component, yaw from the horizontal vector.
export function cameraConfigFromView(cam: Vec, target: Vec, fov: number): PhaseCameraConfig {
  const dx = cam.x - target.x;
  const dy = cam.y - target.y;
  const dz = cam.z - target.z;
  const distance = Math.hypot(dx, dy, dz);
  if (distance < 1e-4) return { ...DEFAULT_PHASE_CAMERA, fov, targetHeight: target.y };
  const pitch = Math.acos(Math.max(-1, Math.min(1, dy / distance))); // 0 = above, π/2 = level
  const yaw = Math.atan2(dx, dz);
  return {
    distance: Math.round(distance * 100) / 100,
    yawDeg: Math.round(yaw * RAD2DEG * 100) / 100,
    pitchDeg: Math.round(pitch * RAD2DEG * 100) / 100,
    fov,
    targetHeight: Math.round(target.y * 100) / 100,
  };
}

// The camera offset (from the look target) for a config — mirrors FollowCamera's orbit math, shared so the
// runtime and tests agree. Returns [x, y, z] to add to the target point.
export function cameraOffsetFromConfig(c: PhaseCameraConfig): [number, number, number] {
  const pitch = c.pitchDeg * DEG2RAD;
  const yaw = c.yawDeg * DEG2RAD;
  const sp = Math.sin(pitch);
  const cp = Math.cos(pitch);
  return [c.distance * sp * Math.sin(yaw), c.distance * cp, c.distance * sp * Math.cos(yaw)];
}
