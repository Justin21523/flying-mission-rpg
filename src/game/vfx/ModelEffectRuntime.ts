import type { EffectParameters, EffectTypeV2 } from '../../types/game/transformationEffects';
import type { ModelLayerSettings, ModelEffectShape } from '../../types/modelEffectTypes';
import { MODEL_LAYER_MAX_COUNT } from '../../types/modelEffectTypes';

// Model / component layer → unified V2 model-particle params (Batch F.5). Reuses ModelParticleRenderer (pooled
// GLB clones) with a geometry placeholder fallback when the model id is absent. 'attach' = a single model at
// the anchor/socket (count 1, no spread).
const SHAPE_TO_PARTICLE: Record<ModelEffectShape, NonNullable<EffectParameters['particleShape']>> = {
  attach: 'orbit', burst: 'burst', debris: 'burst', orbit: 'orbit', rain: 'rising', rising: 'rising', assembly: 'orbit',
};
const SHAPE_TO_V2: Record<ModelEffectShape, EffectTypeV2> = {
  attach: 'model_orbit_swarm', burst: 'model_particle_burst', debris: 'model_debris_field',
  orbit: 'model_orbit_swarm', rain: 'model_rain', rising: 'model_rising_swarm', assembly: 'model_orbit_swarm',
};

export interface ModelLayerResult {
  v2EffectType: EffectTypeV2;
  modelId?: string;
  params: EffectParameters;
}

export function modelLayerToParams(m: ModelLayerSettings): ModelLayerResult {
  const isAttach = m.shape === 'attach';
  return {
    v2EffectType: SHAPE_TO_V2[m.shape],
    modelId: m.modelAssetId,
    params: {
      particleCount: isAttach ? 1 : Math.min(Math.max(1, m.count), MODEL_LAYER_MAX_COUNT),
      particleModelId: m.modelAssetId,
      particleModelScale: m.scale,
      particleModelSpin: m.spin ?? 0,
      particleShape: SHAPE_TO_PARTICLE[m.shape],
      particleSpreadRadius: isAttach ? 0 : (m.spreadRadius ?? 2),
      particleLifetime: 0.8,
      particleOrbitRadius: m.spreadRadius ?? 1.5,
      particleMaterialMode: m.materialMode ?? 'solid',
    },
  };
}
