import type { CombatStats } from '../../types/game/combat';

// Pure energy helpers. ignoreEnergyCost / godMode is the debug bypass (energy never blocks a cast).

export function canAfford(stats: CombatStats, energyCost: number, ignoreEnergyCost = false): boolean {
  if (ignoreEnergyCost) return true;
  return stats.energy >= energyCost;
}

// Returns the new energy value after spending (clamped at 0). With ignoreEnergyCost, energy is unchanged.
export function spendEnergy(stats: CombatStats, energyCost: number, ignoreEnergyCost = false): number {
  if (ignoreEnergyCost) return stats.energy;
  return Math.max(0, stats.energy - energyCost);
}

// Regenerate energy toward max over dt seconds. ignoreEnergyCost keeps it topped up for god-mode testing.
export function regenEnergy(stats: CombatStats, dt: number, ignoreEnergyCost = false): number {
  if (ignoreEnergyCost) return stats.maxEnergy;
  return Math.min(stats.maxEnergy, stats.energy + stats.energyRegenPerSecond * dt);
}
