import type { CombatStats } from '../../types/game/combat';

// Pure player-shield helpers: regen kicks in only after `shieldRegenDelaySeconds` have passed since the last
// shield damage. Returns the new shield value (does not mutate). `lastShieldDamageMs` is tracked by caller.

export function regenShield(stats: CombatStats, dt: number, msSinceLastDamage: number): number {
  if (stats.shield >= stats.maxShield) return stats.shield;
  if (msSinceLastDamage < stats.shieldRegenDelaySeconds * 1000) return stats.shield;
  return Math.min(stats.maxShield, stats.shield + stats.shieldRegenPerSecond * dt);
}

// Apply raw incoming damage to a player's shield-then-hp. Returns the new {hp, shield} + whether shield broke.
export function applyPlayerDamage(stats: CombatStats, amount: number): { hp: number; shield: number; shieldBroken: boolean } {
  if (stats.invulnerable) return { hp: stats.hp, shield: stats.shield, shieldBroken: false };
  let remaining = Math.max(0, amount);
  let shield = stats.shield;
  const shieldDamage = Math.min(shield, remaining);
  shield -= shieldDamage;
  remaining -= shieldDamage;
  const hp = Math.max(0, stats.hp - remaining);
  return { hp, shield, shieldBroken: stats.shield > 0 && shield <= 0 };
}
