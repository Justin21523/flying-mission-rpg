import type { CombatEffectDefinition, GeometryType, GeometryAnimate } from '../../types/game/combat';

// Model-first geometry effects for boss attack warnings + executions (Batch F). Same renderer
// (GeometryEffectRenderer) as kit/support effects; merged into the combat-effect store seed. Particles
// are accents only — the warnings/executions are geometry meshes.
const fx = (id: string, geometryType: GeometryType, dims: Record<string, number>, color: string, animate: GeometryAnimate, durationSeconds = 0.6): CombatEffectDefinition => ({
  id,
  effectType: geometryType === 'torus' ? 'ring-burst' : 'geometry-range',
  geometry: { geometryType, dimensions: dims, renderMode: 'transparent', animate },
  color,
  timing: { startDelaySeconds: 0, durationSeconds, fadeOutSeconds: 0.25 },
  pooling: { poolId: 'geo', reusable: true },
  cleanup: { releaseToPool: true, destroyOnComplete: false },
});

// Boss model preset id (a real GLB; reused from the legacy crystal boss). BossRenderer composes extra meshes
// around it so the boss is never a lone sphere.
export const HARBOR_CORE_MODEL = 'others/crystal boss 3d model';

export const SEED_BOSS_EFFECTS: CombatEffectDefinition[] = [
  fx('fx_boss_projectile_warn', 'ring', { radius: 2, width: 0.3 }, '#fca5a5', 'pulse', 0.6),
  fx('fx_boss_shield_pulse', 'cylinder', { radius: 6, height: 0.6 }, '#38bdf8', 'expand', 0.6),
  fx('fx_boss_shockwave_warn', 'ring', { radius: 8, width: 0.5 }, '#fbbf24', 'pulse', 0.9),
  fx('fx_boss_shockwave_exec', 'torus', { radius: 8, width: 0.5 }, '#f59e0b', 'expand', 0.45),
  fx('fx_boss_sweep_warn', 'cone', { radius: 14, angleDegrees: 50, height: 0.4 }, '#fca5a5', 'pulse', 1.2),
  fx('fx_boss_sweep_exec', 'cone', { radius: 14, angleDegrees: 50, height: 0.4 }, '#ef4444', 'sweep', 0.6),
  fx('fx_boss_spawn_marker', 'ring', { radius: 2, width: 0.3 }, '#a5f3fc', 'expand', 0.6),
];
