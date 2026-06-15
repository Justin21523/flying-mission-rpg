import type { ModelLayerSettings } from '../../types/modelEffectTypes';

// Reusable model / object-assembly layer presets (Batch F.5). Only VERIFIED GLB ids are referenced (so the
// model-existence test passes); other "model-ish" visuals use geometry layers instead.
export const VFX_MODELS = {
  drone: 'characters/Carey drone 3d model',
  barrier: 'outerior_decors/construction barrier 3d model',
  container: 'props/shipping container 3d model',
  shelving: 'props/colorful shelving unit 3d model',
  lion: 'yokais/red+fire+lion+3d+model',
  cat: 'yokais/brave+cat+warrior+3d+model',
} as const;

export const MODEL_PRESETS = {
  decoy: (): ModelLayerSettings => ({ modelAssetId: VFX_MODELS.drone, shape: 'attach', count: 1, scale: 1, spin: 1.5, fallbackOffset: [0, 1, 1] }),
  toolSwarm: (): ModelLayerSettings => ({ modelAssetId: VFX_MODELS.shelving, shape: 'orbit', count: 4, scale: 0.4, spin: 1, spreadRadius: 2 }),
  rubble: (): ModelLayerSettings => ({ modelAssetId: VFX_MODELS.container, shape: 'debris', count: 6, scale: 0.35, spreadRadius: 3 }),
  assembly: (): ModelLayerSettings => ({ modelAssetId: VFX_MODELS.barrier, shape: 'assembly', count: 5, scale: 0.5, spreadRadius: 3, assembleSeconds: 0.8 }),
  animalSpirit: (): ModelLayerSettings => ({ modelAssetId: VFX_MODELS.lion, shape: 'burst', count: 3, scale: 0.6, spreadRadius: 4 }),
  beastRush: (): ModelLayerSettings => ({ modelAssetId: VFX_MODELS.cat, shape: 'rising', count: 4, scale: 0.5, spreadRadius: 3 }),
  droneSwarm: (): ModelLayerSettings => ({ modelAssetId: VFX_MODELS.drone, shape: 'orbit', count: 3, scale: 0.7, spin: 2, spreadRadius: 3 }),
} as const;
