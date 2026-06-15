import type { GeometryEffectDefinition } from '../../types/game/combat';

// Reusable geometry layer presets (Batch F.5) — ring/dome/cone/panel built from the combat GeometryEffect
// shapes, rendered via the unified V2 light/space renderer.
export const GEOM_PRESETS = {
  shockRing: (radius = 6): GeometryEffectDefinition => ({ geometryType: 'torus', dimensions: { radius, width: 0.5 }, renderMode: 'transparent', animate: 'expand' }),
  scanCone: (radius = 9): GeometryEffectDefinition => ({ geometryType: 'cone', dimensions: { radius, angleDegrees: 60, height: 0.4 }, renderMode: 'transparent', animate: 'expand' }),
  dome: (radius = 5): GeometryEffectDefinition => ({ geometryType: 'sphere', dimensions: { radius }, renderMode: 'transparent', animate: 'pulse' }),
  shieldPanel: (): GeometryEffectDefinition => ({ geometryType: 'box', dimensions: { width: 2.4, height: 2, length: 0.2 }, renderMode: 'transparent', animate: 'pulse' }),
  lockLine: (length = 14): GeometryEffectDefinition => ({ geometryType: 'box', dimensions: { length, width: 0.4, height: 0.4 }, renderMode: 'transparent', animate: 'expand' }),
  groundMarker: (radius = 4): GeometryEffectDefinition => ({ geometryType: 'ring', dimensions: { radius, width: 0.4 }, renderMode: 'transparent', animate: 'pulse' }),
  orbitRing: (radius = 6): GeometryEffectDefinition => ({ geometryType: 'torus', dimensions: { radius, width: 0.3 }, renderMode: 'transparent', animate: 'rotate' }),
} as const;
