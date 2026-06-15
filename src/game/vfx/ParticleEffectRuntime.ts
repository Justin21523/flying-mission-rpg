import type { EffectParameters } from '../../types/game/transformationEffects';
import type { ParticleLayerSettings, ParticleSpawnShape } from '../../types/particleEffectTypes';
import { PARTICLE_LAYER_MAX_COUNT } from '../../types/particleEffectTypes';

// Particle layer → unified V2 ParticleEffectParameters (Batch F.5). Reuses the pooled transformation
// ParticleRenderer (THREE.Points). No new particle engine — this just maps authoring settings to V2 params.
const avg = (r: [number, number]) => (r[0] + r[1]) / 2;
const SHAPE_MAP: Record<ParticleSpawnShape, NonNullable<EffectParameters['particleShape']>> = {
  point: 'burst', sphere: 'burst', cone: 'starburst', ring: 'ring', box: 'burst', line: 'beam',
};

export function particleLayerToParams(p: ParticleLayerSettings): EffectParameters {
  return {
    particleCount: Math.min(Math.max(0, p.count), PARTICLE_LAYER_MAX_COUNT),
    particleLifetime: avg(p.lifetimeRange),
    particleSize: avg(p.sizeRange),
    particleSpeed: avg(p.speedRange),
    particleGravity: p.gravity?.[1] ?? 0,
    particleSpreadRadius: ((p.spreadAngleDegrees ?? 60) / 90) * 3,
    particleColorStart: p.colorStart,
    particleColorEnd: p.colorEnd ?? p.colorStart,
    particleOpacityStart: p.opacityStart ?? 1,
    particleOpacityEnd: p.opacityEnd ?? 0,
    particleShape: SHAPE_MAP[p.spawnShape],
  };
}
