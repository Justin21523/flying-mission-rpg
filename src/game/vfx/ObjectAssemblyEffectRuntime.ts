import type { EffectParameters, EffectTypeV2 } from '../../types/game/transformationEffects';
import type { ModelLayerSettings } from '../../types/modelEffectTypes';
import { modelLayerToParams } from './ModelEffectRuntime';

// Object-assembly layer → unified V2 params (Batch F.5). Multiple model fragments converge toward the anchor
// and lock into a built shape (Donnie tool assembly, Todd rubble, Flip stadium edge). Approximated by the
// V2 model-orbit swarm with an inward bias + the assemble window; reuses ModelParticleRenderer's pooled clones.
export interface AssemblyLayerResult {
  v2EffectType: EffectTypeV2;
  modelId?: string;
  params: EffectParameters;
}

export function assemblyLayerToParams(m: ModelLayerSettings): AssemblyLayerResult {
  const base = modelLayerToParams({ ...m, shape: 'orbit' });
  return {
    v2EffectType: 'model_orbit_swarm',
    modelId: m.modelAssetId,
    params: {
      ...base.params,
      particleShape: 'orbit',
      particleOrbitRadius: m.spreadRadius ?? 3,
      particleOrbitSpeed: 2,
      // shrink-in over the assemble window so fragments converge into the built object.
      particleSizeOverTime: 1.2,
      particleLifetime: m.assembleSeconds ?? 0.9,
    },
  };
}
