import type { ParticleLayerSettings } from '../../types/particleEffectTypes';

// Reusable particle layer presets (Batch F.5). Tinted per ability via the builder's color override.
export const PARTICLE_PRESETS = {
  burst: (color: string): ParticleLayerSettings => ({ count: 70, spawnShape: 'sphere', speedRange: [4, 9], sizeRange: [0.12, 0.3], lifetimeRange: [0.3, 0.6], colorStart: color, colorEnd: color, opacityStart: 1, opacityEnd: 0, blendMode: 'additive', spreadAngleDegrees: 90 }),
  sparks: (color: string): ParticleLayerSettings => ({ count: 50, spawnShape: 'cone', speedRange: [6, 12], sizeRange: [0.06, 0.14], lifetimeRange: [0.25, 0.5], gravity: [0, -10, 0], colorStart: color, colorEnd: '#ffffff', opacityStart: 1, opacityEnd: 0, blendMode: 'additive', spreadAngleDegrees: 50 }),
  trail: (color: string): ParticleLayerSettings => ({ count: 40, spawnShape: 'line', speedRange: [2, 5], sizeRange: [0.1, 0.22], lifetimeRange: [0.2, 0.4], colorStart: color, colorEnd: color, opacityStart: 0.9, opacityEnd: 0, blendMode: 'additive' }),
  motes: (color: string): ParticleLayerSettings => ({ count: 45, spawnShape: 'ring', speedRange: [1, 3], sizeRange: [0.08, 0.18], lifetimeRange: [0.5, 1.0], colorStart: color, colorEnd: color, opacityStart: 0.8, opacityEnd: 0, blendMode: 'soft' }),
  debris: (color: string): ParticleLayerSettings => ({ count: 36, spawnShape: 'cone', speedRange: [5, 11], sizeRange: [0.12, 0.28], lifetimeRange: [0.4, 0.8], gravity: [0, -14, 0], colorStart: color, colorEnd: color, opacityStart: 1, opacityEnd: 0, blendMode: 'normal', spreadAngleDegrees: 70 }),
  electric: (color: string): ParticleLayerSettings => ({ count: 60, spawnShape: 'box', speedRange: [8, 16], sizeRange: [0.05, 0.12], lifetimeRange: [0.12, 0.3], colorStart: color, colorEnd: '#bfe6ff', opacityStart: 1, opacityEnd: 0, blendMode: 'additive' }),
} as const;
