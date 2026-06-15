// Cinematic VFX — fog / cloud / smoke layer settings (Batch F.5). Soft billboard/instanced puffs (no real
// volumetrics) — translated by the director into the unified V2 particle/physics renderers + a dedicated
// `fog_card` billboard renderer. Gives cloud/smoke/dust/shockwave-fog feel with pooling.

export interface FogCloudLayerSettings {
  puffCount: number;
  radiusRange: [number, number];
  opacityRange: [number, number];
  expansionSpeed: number;
  driftDirection?: [number, number, number];
  driftSpeed?: number;
  rotationSpeedRange?: [number, number];
  color?: string;
  softEdges: boolean;
}

export const FOG_CLOUD_LAYER_MAX_PUFFS = 200;
