import type { CombatEffectDefinition } from '../../types/game/combat';

// Model-first skill effects (geometry meshes, not particle stubs). Each placeholder skill points its
// effectDefinitionId here. GeometryEffectRenderer renders these; CombatEffectDirector pools + cleans up.
export const SEED_COMBAT_EFFECTS: CombatEffectDefinition[] = [
  {
    id: 'fx_arc_sweep',
    effectType: 'geometry-range',
    geometry: { geometryType: 'cone', dimensions: { radius: 4, angleDegrees: 90, height: 0.4 }, renderMode: 'transparent', animate: 'sweep' },
    color: '#ff5a3c',
    timing: { startDelaySeconds: 0, durationSeconds: 0.4, fadeOutSeconds: 0.15 },
    pooling: { poolId: 'geo', reusable: true },
    cleanup: { releaseToPool: true, destroyOnComplete: false },
  },
  {
    id: 'fx_line_beam',
    effectType: 'geometry-range',
    geometry: { geometryType: 'box', dimensions: { length: 16, width: 0.6, height: 0.6 }, renderMode: 'additive', animate: 'expand' },
    color: '#3cc8ff',
    timing: { startDelaySeconds: 0, durationSeconds: 0.5, fadeOutSeconds: 0.2 },
    pooling: { poolId: 'geo', reusable: true },
    cleanup: { releaseToPool: true, destroyOnComplete: false },
  },
  {
    id: 'fx_ring_burst',
    effectType: 'ring-burst',
    geometry: { geometryType: 'torus', dimensions: { radius: 7, width: 0.4 }, renderMode: 'transparent', animate: 'expand' },
    color: '#c084fc',
    timing: { startDelaySeconds: 0, durationSeconds: 0.6, fadeOutSeconds: 0.2 },
    pooling: { poolId: 'geo', reusable: true },
    cleanup: { releaseToPool: true, destroyOnComplete: false },
  },
];
