import { describe, it, expect } from 'vitest';
import { particleLayerToParams } from '../../game/vfx/ParticleEffectRuntime';
import { PARTICLE_LAYER_MAX_COUNT } from '../../types/particleEffectTypes';

describe('ParticleEffectRuntime', () => {
  it('maps authoring settings to V2 particle params', () => {
    const p = particleLayerToParams({ count: 50, spawnShape: 'cone', speedRange: [4, 8], sizeRange: [0.1, 0.3], lifetimeRange: [0.2, 0.6], colorStart: '#ff0000', opacityStart: 1, opacityEnd: 0 });
    expect(p.particleCount).toBe(50);
    expect(p.particleSpeed).toBe(6);
    expect(p.particleSize).toBeCloseTo(0.2, 5);
    expect(p.particleShape).toBe('starburst'); // cone → starburst
    expect(p.particleColorStart).toBe('#ff0000');
  });

  it('clamps the particle count to the cap', () => {
    const p = particleLayerToParams({ count: 9999, spawnShape: 'sphere', speedRange: [1, 2], sizeRange: [0.1, 0.1], lifetimeRange: [0.5, 0.5] });
    expect(p.particleCount).toBe(PARTICLE_LAYER_MAX_COUNT);
    expect(p.particleShape).toBe('burst');
  });
});
