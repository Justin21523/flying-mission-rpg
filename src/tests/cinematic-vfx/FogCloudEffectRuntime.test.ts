import { describe, it, expect } from 'vitest';
import { fogLayerToParams } from '../../game/vfx/FogCloudEffectRuntime';
import { FOG_CLOUD_LAYER_MAX_PUFFS } from '../../types/fogCloudEffectTypes';

describe('FogCloudEffectRuntime', () => {
  it('maps fog settings to soft expanding particle params', () => {
    const f = fogLayerToParams({ puffCount: 30, radiusRange: [1, 3], opacityRange: [0.3, 0.5], expansionSpeed: 4, color: '#88aacc', softEdges: true });
    expect(f.particleCount).toBe(30);
    expect(f.particleShape).toBe('ground');
    expect(f.particleSize).toBe(2);
    expect(f.particleOpacityEnd).toBe(0); // fades out (cleanup)
  });

  it('clamps the puff count', () => {
    const f = fogLayerToParams({ puffCount: 5000, radiusRange: [1, 2], opacityRange: [0.4, 0.4], expansionSpeed: 3, softEdges: true });
    expect(f.particleCount).toBe(FOG_CLOUD_LAYER_MAX_PUFFS);
  });
});
