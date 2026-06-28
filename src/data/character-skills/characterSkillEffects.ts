import type { CombatEffectDefinition, GeometryType, GeometryAnimate } from '../../types/game/combat';

// Model-first geometry effects for the MVP character kits (Batch D-kits). Rendered by GeometryEffectRenderer
// (cone/box/torus/cylinder/line) + pooled + auto-cleaned. Particles are not used as the main body here.
const fx = (id: string, geometryType: GeometryType, dims: Record<string, number>, color: string, animate: GeometryAnimate, durationSeconds = 0.5): CombatEffectDefinition => ({
  id,
  effectType: geometryType === 'torus' ? 'ring-burst' : 'geometry-range',
  geometry: { geometryType, dimensions: dims, renderMode: 'transparent', animate },
  color,
  timing: { startDelaySeconds: 0, durationSeconds, fadeOutSeconds: 0.2 },
  pooling: { poolId: 'geo', reusable: true },
  cleanup: { releaseToPool: true, destroyOnComplete: false },
});

export const SEED_KIT_EFFECTS: CombatEffectDefinition[] = [
  fx('fx_wing_arc', 'cone', { radius: 4, angleDegrees: 90, height: 0.4 }, '#e8442c', 'sweep', 0.4),
  fx('fx_lock_line', 'box', { length: 16, width: 0.5, height: 0.5 }, '#ff7a5c', 'expand', 0.45),
  fx('fx_cyclone_ring', 'torus', { radius: 6, width: 0.4 }, '#fca5a5', 'expand', 0.6),
  fx('fx_repair_beam', 'box', { length: 12, width: 0.4, height: 0.4 }, '#fbbf24', 'expand', 0.6),
  fx('fx_tool_arc', 'cone', { radius: 3.5, angleDegrees: 90, height: 0.4 }, '#f5b21e', 'sweep', 0.4),
  fx('fx_scan_cone', 'cone', { radius: 8, angleDegrees: 60, height: 0.4 }, '#60a5fa', 'expand', 0.6),
  fx('fx_shield_panel', 'box', { width: 2.4, height: 2, length: 0.2 }, '#3b82f6', 'pulse', 1),
  fx('fx_barrier_line', 'box', { width: 6, height: 1.2, length: 0.4 }, '#2b4c8c', 'expand', 0.5),
  fx('fx_cuff_torus', 'torus', { radius: 1.2, width: 0.18 }, '#93c5fd', 'pulse', 0.6),
  fx('fx_order_ring', 'torus', { radius: 6, width: 0.3 }, '#2b4c8c', 'expand', 0.8),
  fx('fx_decoy', 'cylinder', { radius: 0.6, height: 2 }, '#a5f3fc', 'pulse', 0.8),
  fx('fx_exec_grid', 'torus', { radius: 7, width: 0.3 }, '#3b4a78', 'expand', 0.6),
  // Wave 5 — element-reaction VFX (colours match the status auras in CombatDummyTarget).
  fx('fx_shatter_burst', 'torus', { radius: 5, width: 0.5 }, '#67e8f9', 'expand', 0.6),       // frozen → shatter (cyan)
  fx('fx_overload_blast', 'sphere', { radius: 6 }, '#fb923c', 'pulse', 0.7),                   // burning → overload (orange)
  fx('fx_conduct_chain', 'torus', { radius: 7, width: 0.3 }, '#fef9c3', 'rotate', 0.8),        // shocked → conduct (yellow)
  fx('fx_meltdown_implosion', 'cone', { radius: 4, angleDegrees: 120, height: 0.6 }, '#f87171', 'contract', 0.65), // frozen+burn → meltdown (red)
];
