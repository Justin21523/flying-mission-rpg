import { describe, expect, it } from 'vitest';
import { listTransformationEditTargets, resolveTransformationEditTarget } from './transformationEditTargets';
import { transformRootKey } from './transformPartKey';
import { makeTimeline } from './testFixture';

describe('transformationEditTargets', () => {
  it('lists root, model slots, parts, effects, and camera targets', () => {
    const def = makeTimeline();
    const keys = listTransformationEditTargets(def).map((target) => target.key);

    expect(keys).toContain(transformRootKey(def.id));
    expect(keys.some((key) => key.includes('__model_slot__robot'))).toBe(true);
    expect(keys.some((key) => key.includes('__effect__'))).toBe(true);
    expect(keys.some((key) => key.includes('__camera_shot__'))).toBe(true);
  });

  it('lists camera-shot stage anchors and look targets', () => {
    const def = makeTimeline({
      cameraShots: [],
      stages: [{ id: 'stage_cam', type: 'camera-shot', startTime: 0, duration: 1, enabled: true, params: { cameraShotType: 'orbit', distance: 7, height: 2, angle: 0, fov: 55 } }],
    });
    const keys = listTransformationEditTargets(def).map((target) => target.key);

    expect(keys.some((key) => key.includes('__camera_shot__stage_cam'))).toBe(true);
    expect(keys.some((key) => key.includes('__camera_look__stage_cam'))).toBe(true);
  });

  it('resolves selected target metadata', () => {
    const def = makeTimeline();
    const target = resolveTransformationEditTarget(def, transformRootKey(def.id));

    expect(target.kind).toBe('root');
    expect(target.canBake).toBe(true);
  });
});
