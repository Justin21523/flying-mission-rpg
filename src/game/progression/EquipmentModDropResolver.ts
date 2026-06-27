import { useEquipmentModDefStore } from '../../stores/game/useEquipmentModDefStore';
import type { Difficulty } from '../../types/game/settings';
import type { EquipmentModRarity } from '../../types/game/equipmentMod';

// Wave 4 — equipment-mod drops. Pure decisions (rng injectable for tests). Enemy kills have a small chance to
// drop a non-common mod; bosses always drop one (higher rarity). Difficulty shifts the rarity odds upward.

const DROPPABLE: EquipmentModRarity[] = ['rare', 'epic', 'legendary'];

// Per-difficulty rarity weights for a normal enemy drop (commons are owned by default, never dropped).
function enemyRarityWeights(d: Difficulty): Record<EquipmentModRarity, number> {
  switch (d) {
    case 'ng-plus': return { common: 0, rare: 4, epic: 4, legendary: 1.5 };
    case 'hard': return { common: 0, rare: 6, epic: 3, legendary: 0.6 };
    default: return { common: 0, rare: 8, epic: 1.5, legendary: 0.2 };
  }
}
function bossRarityWeights(d: Difficulty): Record<EquipmentModRarity, number> {
  switch (d) {
    case 'ng-plus': return { common: 0, rare: 1, epic: 5, legendary: 4 };
    case 'hard': return { common: 0, rare: 3, epic: 5, legendary: 1.5 };
    default: return { common: 0, rare: 5, epic: 3, legendary: 0.7 };
  }
}

// Base per-kill drop chance, nudged up by enemy max HP (tankier → likelier) and difficulty.
function killDropChance(enemyMaxHp: number, d: Difficulty): number {
  const hpBump = Math.min(0.06, enemyMaxHp / 4000); // up to +6% for big enemies
  const diff = d === 'ng-plus' ? 0.06 : d === 'hard' ? 0.03 : 0;
  return 0.04 + hpBump + diff;
}

function pickWeighted<T>(entries: [T, number][], rng: () => number): T | null {
  const total = entries.reduce((s, [, w]) => s + Math.max(0, w), 0);
  if (total <= 0) return null;
  let r = rng() * total;
  for (const [v, w] of entries) { r -= Math.max(0, w); if (r <= 0) return v; }
  return entries[entries.length - 1]?.[0] ?? null;
}

function pickModOfRarity(rarity: EquipmentModRarity, rng: () => number): string | null {
  const pool = useEquipmentModDefStore.getState().items.filter((m) => m.enabled !== false && (m.rarity ?? 'common') === rarity);
  if (pool.length === 0) return null;
  return pickWeighted(pool.map((m) => [m.id, m.dropWeight ?? 1] as [string, number]), rng);
}

function rollFromWeights(weights: Record<EquipmentModRarity, number>, rng: () => number): string | null {
  const rarity = pickWeighted(DROPPABLE.map((r) => [r, weights[r]] as [EquipmentModRarity, number]), rng);
  if (!rarity) return null;
  // Fall back to a lower droppable rarity if the chosen bucket is empty.
  for (let i = DROPPABLE.indexOf(rarity); i >= 0; i--) {
    const id = pickModOfRarity(DROPPABLE[i], rng);
    if (id) return id;
  }
  return null;
}

export function rollModDrop(enemyMaxHp: number, difficulty: Difficulty, rng: () => number = Math.random): string | null {
  if (rng() >= killDropChance(enemyMaxHp, difficulty)) return null;
  return rollFromWeights(enemyRarityWeights(difficulty), rng);
}

export function rollBossModDrop(difficulty: Difficulty, rng: () => number = Math.random): string | null {
  return rollFromWeights(bossRarityWeights(difficulty), rng); // bosses always attempt a drop
}
