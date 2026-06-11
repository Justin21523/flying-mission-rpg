import { describe, it, expect } from 'vitest';
import { cameraConfigFromView, cameraOffsetFromConfig, DEFAULT_PHASE_CAMERA } from './cameraConfig';
import type { PhaseCameraConfig } from './cameraConfig';

describe('cameraConfig', () => {
  it('round-trips config → offset → config', () => {
    const cfg: PhaseCameraConfig = { distance: 12, yawDeg: 200, pitchDeg: 40, fov: 55, targetHeight: 1.5 };
    const target = { x: 3, y: 1.5, z: -2 };
    const off = cameraOffsetFromConfig(cfg);
    const cam = { x: target.x + off[0], y: target.y + off[1], z: target.z + off[2] };
    const back = cameraConfigFromView(cam, target, 55);
    const sameAngle = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180) < 0.5;
    expect(back.distance).toBeCloseTo(12, 1);
    expect(sameAngle(back.yawDeg, 200)).toBe(true); // 200° ≡ -160° (atan2 range)
    expect(back.pitchDeg).toBeCloseTo(40, 0);
    expect(back.targetHeight).toBeCloseTo(1.5, 1);
  });

  it('camera directly above the target → pitch 0 (top-down)', () => {
    const c = cameraConfigFromView({ x: 0, y: 10, z: 0 }, { x: 0, y: 0, z: 0 }, 50);
    expect(c.pitchDeg).toBeCloseTo(0, 1);
    expect(c.distance).toBeCloseTo(10, 1);
  });

  it('camera level behind (+z) → pitch 90, yaw 0', () => {
    const c = cameraConfigFromView({ x: 0, y: 0, z: 9 }, { x: 0, y: 0, z: 0 }, 50);
    expect(c.pitchDeg).toBeCloseTo(90, 1);
    expect(c.yawDeg).toBeCloseTo(0, 1);
  });

  it('degenerate (cam == target) → defaults with the given fov + targetHeight', () => {
    const c = cameraConfigFromView({ x: 1, y: 2, z: 3 }, { x: 1, y: 2, z: 3 }, 70);
    expect(c.fov).toBe(70);
    expect(c.distance).toBe(DEFAULT_PHASE_CAMERA.distance);
  });
});
