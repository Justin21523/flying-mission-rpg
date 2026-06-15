import type { FogCloudLayerSettings } from '../../types/fogCloudEffectTypes';

// Reusable fog / cloud / smoke layer presets (Batch F.5).
export const FOG_PRESETS = {
  windFog: (color: string): FogCloudLayerSettings => ({ puffCount: 28, radiusRange: [1.2, 2.6], opacityRange: [0.25, 0.45], expansionSpeed: 5, driftDirection: [0, 0.2, 1], driftSpeed: 3, color, softEdges: true }),
  impactDust: (color: string): FogCloudLayerSettings => ({ puffCount: 34, radiusRange: [1.4, 3.2], opacityRange: [0.35, 0.6], expansionSpeed: 4, color, softEdges: true }),
  smokeRing: (color: string): FogCloudLayerSettings => ({ puffCount: 24, radiusRange: [1.6, 3.0], opacityRange: [0.3, 0.5], expansionSpeed: 3.5, rotationSpeedRange: [0.4, 1.2], color, softEdges: true }),
  natureFog: (color: string): FogCloudLayerSettings => ({ puffCount: 30, radiusRange: [1.5, 3.5], opacityRange: [0.22, 0.4], expansionSpeed: 2.5, driftDirection: [0, 0.4, 0], driftSpeed: 1.5, color, softEdges: true }),
  stealthSmoke: (color: string): FogCloudLayerSettings => ({ puffCount: 26, radiusRange: [1.2, 2.4], opacityRange: [0.35, 0.55], expansionSpeed: 2, color, softEdges: true }),
} as const;
