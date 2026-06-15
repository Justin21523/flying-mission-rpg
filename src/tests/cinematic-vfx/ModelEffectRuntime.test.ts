import { describe, it, expect } from 'vitest';
import { modelLayerToParams } from '../../game/vfx/ModelEffectRuntime';

describe('ModelEffectRuntime', () => {
  it('maps a model layer to V2 model-particle params + effect type', () => {
    const r = modelLayerToParams({ modelAssetId: 'characters/Carey drone 3d model', shape: 'burst', count: 5, scale: 0.5, spreadRadius: 3 });
    expect(r.v2EffectType).toBe('model_particle_burst');
    expect(r.modelId).toBe('characters/Carey drone 3d model');
    expect(r.params.particleCount).toBe(5);
    expect(r.params.particleModelScale).toBe(0.5);
  });

  it('attach shape = single model, no spread (socket fallback)', () => {
    const r = modelLayerToParams({ shape: 'attach', count: 4, scale: 1, fallbackOffset: [0, 1, 1] });
    expect(r.params.particleCount).toBe(1);
    expect(r.params.particleSpreadRadius).toBe(0);
    expect(r.modelId).toBeUndefined(); // no model → geometry fallback in the renderer
  });
});
