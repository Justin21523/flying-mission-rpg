import type { CombatEffectDefinition, GeometryType, GeometryAnimate } from '../../types/game/combat';

// Model-first geometry effects for the MVP support-combat abilities (Batch E). Same shape + renderer
// (GeometryEffectRenderer) as the character-kit effects — particles are accents only, the body is geometry.
const fx = (id: string, geometryType: GeometryType, dims: Record<string, number>, color: string, animate: GeometryAnimate, durationSeconds = 0.6): CombatEffectDefinition => ({
  id,
  effectType: geometryType === 'torus' ? 'ring-burst' : 'geometry-range',
  geometry: { geometryType, dimensions: dims, renderMode: 'transparent', animate },
  color,
  timing: { startDelaySeconds: 0, durationSeconds, fadeOutSeconds: 0.25 },
  pooling: { poolId: 'geo', reusable: true },
  cleanup: { releaseToPool: true, destroyOnComplete: false },
});

export const SEED_SUPPORT_EFFECTS: CombatEffectDefinition[] = [
  // Strike Support — overhead air-strike ring + ground warning marker.
  fx('fx_strike_ring', 'torus', { radius: 6, width: 0.5 }, '#e8442c', 'expand', 0.5),
  fx('fx_strike_marker', 'ring', { radius: 6, width: 0.4 }, '#ff7a5c', 'pulse', 0.9),
  // Shield Support — dome + rotating hex panels.
  fx('fx_shield_dome', 'sphere', { radius: 5 }, '#3b82f6', 'pulse', 1.2),
  fx('fx_shield_panels', 'torus', { radius: 5, width: 0.3 }, '#60a5fa', 'rotate', 1.2),
  // Repair Support — repair beam tube + repair node.
  fx('fx_repair_beam_support', 'box', { length: 12, width: 0.4, height: 0.4 }, '#fbbf24', 'expand', 0.7),
  fx('fx_repair_node', 'torus', { radius: 1, width: 0.18 }, '#fde68a', 'pulse', 0.8),
  // Scan Support — scan dome + weakpoint marker.
  fx('fx_scan_dome', 'sphere', { radius: 10 }, '#60a5fa', 'expand', 0.7),
  fx('fx_weakpoint_marker', 'torus', { radius: 0.8, width: 0.16 }, '#93c5fd', 'pulse', 0.9),
  // Taunt Support — decoy hologram column.
  fx('fx_decoy_hologram', 'cylinder', { radius: 0.7, height: 2.2 }, '#a5f3fc', 'pulse', 1.2),
  // Break Support — drill cone on the obstacle.
  fx('fx_break_drill', 'cone', { radius: 1.2, angleDegrees: 40, height: 2 }, '#f5b21e', 'rotate', 0.7),
];
