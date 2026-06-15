import type { EffectParameters } from '../../types/game/transformationEffects';
import type { FogCloudLayerSettings } from '../../types/fogCloudEffectTypes';
import { FOG_CLOUD_LAYER_MAX_PUFFS } from '../../types/fogCloudEffectTypes';

// Fog / cloud / smoke layer → unified V2 params (Batch F.5). Soft, large, slow particles (V2 particle 'ground'
// / 'dome' shapes) give cloud/smoke/dust feel without real volumetrics — reuses the pooled ParticleRenderer.
const avg = (r: [number, number]) => (r[0] + r[1]) / 2;

export function fogLayerToParams(f: FogCloudLayerSettings): EffectParameters {
  return {
    particleCount: Math.min(Math.max(0, f.puffCount), FOG_CLOUD_LAYER_MAX_PUFFS),
    particleLifetime: 1.0,
    particleSize: avg(f.radiusRange),
    particleSizeOverTime: 1.6,
    particleSpeed: f.expansionSpeed,
    particleGravity: (f.driftDirection?.[1] ?? 0) * (f.driftSpeed ?? 0),
    particleSpreadRadius: avg(f.radiusRange) * 0.6,
    particleColorStart: f.color,
    particleColorEnd: f.color,
    particleOpacityStart: avg(f.opacityRange),
    particleOpacityEnd: 0,
    particleShape: 'ground',
  };
}
