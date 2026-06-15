import type { EffectParameters, EffectTypeV2 } from '../../types/game/transformationEffects';
import type { GeometryEffectDefinition } from '../../types/game/combat';

// Geometry layer → unified V2 light/space params (Batch F.5). Reuses the pooled V2 LightSpaceRenderer
// (ring / dome / flash) for ring/torus/shockwave/scan-cone/shield-panel geometry — one runtime, no parallel
// geometry mesh renderer. Maps geometry dimensions to the light-effect params + the right V2 effect type.
export interface GeometryLayerResult {
  v2EffectType: EffectTypeV2;
  params: EffectParameters;
}

export function geometryLayerToParams(g: GeometryEffectDefinition): GeometryLayerResult {
  const d = g.dimensions;
  const radius = d.radius ?? d.length ?? d.width ?? 3;
  let v2EffectType: EffectTypeV2 = 'shockwave_ring_effect';
  if (g.geometryType === 'sphere' || g.geometryType === 'cylinder') v2EffectType = 'energy_dome_effect';
  else if (g.geometryType === 'plane' || g.geometryType === 'box') v2EffectType = 'radial_burst_effect';
  return {
    v2EffectType,
    params: {
      radius,
      ringCount: 1,
      thickness: d.width ?? 0.4,
      pulseSpeed: g.animate === 'pulse' ? 4 : 1,
      flashStrength: 0.6,
    },
  };
}
