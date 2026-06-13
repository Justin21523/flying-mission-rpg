import { describe, expect, it } from 'vitest';
import { cameraAngleRadians } from './transformationCameraMotion';
import type { TransformationCameraShot } from '../../types/game/transformation';

const orbitShot: TransformationCameraShot = {
  id: 'c1',
  type: 'orbit',
  startTime: 0,
  duration: 1,
  distance: 6,
  height: 2,
  angle: 30,
  fov: 50,
};

describe('transformationCameraMotion', () => {
  it('keeps the legacy no-shot auto orbit by default', () => {
    expect(cameraAngleRadians({ activeCameraShot: null, elapsedTime: 2 })).toBeGreaterThan(0);
  });

  it('locks the main camera when timeline rotation is locked', () => {
    expect(cameraAngleRadians({ activeCameraShot: null, elapsedTime: 2, definition: { cameraRotationMode: 'locked' } })).toBe(0);
  });

  it('does not rotate a shot whose rotation mode is locked', () => {
    const a = cameraAngleRadians({ activeCameraShot: { ...orbitShot, rotationMode: 'locked' }, elapsedTime: 0 });
    const b = cameraAngleRadians({ activeCameraShot: { ...orbitShot, rotationMode: 'locked' }, elapsedTime: 10 });
    expect(b).toBeCloseTo(a);
  });

  it('lets stage-controlled timelines rotate only explicit auto shots', () => {
    const lockedByTimeline = cameraAngleRadians({ activeCameraShot: orbitShot, elapsedTime: 2, definition: { cameraRotationMode: 'stage-controlled' } });
    const explicitAuto = cameraAngleRadians({ activeCameraShot: { ...orbitShot, rotationMode: 'auto', rotateSpeedDeg: 90 }, elapsedTime: 2, definition: { cameraRotationMode: 'stage-controlled' } });
    expect(lockedByTimeline).toBeCloseTo(orbitShot.angle * Math.PI / 180);
    expect(explicitAuto).toBeGreaterThan(lockedByTimeline);
  });
});
