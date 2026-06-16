// Cinematic VFX — model / object-assembly layer settings (Batch F.5). Real GLB models used as effect
// components (socket attachment, fragments, object assembly) — translated by the director into the unified
// V2 ModelParticleRenderer / CloneBurstRenderer + a dedicated `object_assembly` renderer. Falls back to a
// geometry placeholder when the model id is missing.

export type ModelEffectShape = 'attach' | 'burst' | 'debris' | 'orbit' | 'rain' | 'rising' | 'assembly';
export const MODEL_EFFECT_SHAPES: readonly ModelEffectShape[] = ['attach', 'burst', 'debris', 'orbit', 'rain', 'rising', 'assembly'];

export interface ModelLayerSettings {
  modelAssetId?: string; // GLB; geometry placeholder if absent
  shape: ModelEffectShape;
  count: number;
  scale: number;
  spin?: number;
  spreadRadius?: number;
  // socket attachment (attach shape): place on a named character socket, fallback offset if no bone.
  socketName?: string;
  fallbackOffset?: [number, number, number];
  // object-assembly: fragments fly toward the center and lock into a built shape.
  assembleSeconds?: number;
  // Batch F.7 — clone material look (solid by default). Drives blending/opacity/emissive in the renderer.
  materialMode?: 'solid' | 'hologram' | 'afterimage' | 'energy-outline' | 'ghost-trail';
}

export const MODEL_LAYER_MAX_COUNT = 30;
