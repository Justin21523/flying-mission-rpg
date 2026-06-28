import { useEquipmentModInventoryStore } from '../../stores/game/useEquipmentModInventoryStore';
import { useEquipmentModDefStore, getEquipmentModDef } from '../../stores/game/useEquipmentModDefStore';
import { useEquipmentFusionRecipeStore } from '../../stores/game/useEquipmentFusionRecipeStore';
import { useWalletStore } from '../../stores/walletStore';
import type { EquipmentModRarity } from '../../types/game/equipmentMod';

// Wave 5 — equipment-mod fusion: consume N owned mods of one rarity (+ coins) → a random mod of the next
// rarity. Pure-ish (rng injectable for tests); routes through the inventory + wallet + def stores.

export interface FusionResult { ok: boolean; reason?: string; producedModId?: string }

// Total owned mods of a given rarity (sum of counts).
export function ownedOfRarity(rarity: EquipmentModRarity): number {
  const inv = useEquipmentModInventoryStore.getState();
  let total = 0;
  for (const id of inv.ownedIds()) if ((getEquipmentModDef(id)?.rarity ?? 'common') === rarity) total += inv.count(id);
  return total;
}

export function canFuse(recipeId: string): boolean {
  const r = useEquipmentFusionRecipeStore.getState().items.find((x) => x.id === recipeId);
  if (!r || r.enabled === false) return false;
  return ownedOfRarity(r.inputRarity) >= r.inputCount && useWalletStore.getState().coins >= r.coinCost;
}

function weightedPick<T>(entries: [T, number][], rng: () => number): T | null {
  const total = entries.reduce((s, [, w]) => s + Math.max(0, w), 0);
  if (total <= 0) return null;
  let x = rng() * total;
  for (const [v, w] of entries) { x -= Math.max(0, w); if (x <= 0) return v; }
  return entries[entries.length - 1]?.[0] ?? null;
}

export function fuse(recipeId: string, rng: () => number = Math.random): FusionResult {
  const r = useEquipmentFusionRecipeStore.getState().items.find((x) => x.id === recipeId);
  if (!r || r.enabled === false) return { ok: false, reason: 'No such recipe.' };
  if (ownedOfRarity(r.inputRarity) < r.inputCount) return { ok: false, reason: `Need ${r.inputCount} ${r.inputRarity} mods.` };
  if (useWalletStore.getState().coins < r.coinCost) return { ok: false, reason: 'Not enough coins.' };

  // Pick the output BEFORE spending so an empty output pool aborts cleanly.
  const pool = useEquipmentModDefStore.getState().items.filter((m) => m.enabled !== false && (m.rarity ?? 'common') === r.outputRarity);
  if (pool.length === 0) return { ok: false, reason: `No ${r.outputRarity} mods to craft.` };
  const producedModId = weightedPick(pool.map((m) => [m.id, m.dropWeight ?? 1] as [string, number]), rng);
  if (!producedModId) return { ok: false, reason: 'Fusion failed.' };

  if (!useWalletStore.getState().spend(r.coinCost)) return { ok: false, reason: 'Not enough coins.' };
  // Consume inputCount mods of the input rarity (greedy: highest-count stacks first).
  const inv = useEquipmentModInventoryStore.getState();
  let remaining = r.inputCount;
  const candidates = inv.ownedIds()
    .filter((id) => (getEquipmentModDef(id)?.rarity ?? 'common') === r.inputRarity)
    .sort((a, b) => inv.count(b) - inv.count(a));
  for (const id of candidates) {
    while (remaining > 0 && inv.count(id) > 0) { inv.removeCount(id, 1); remaining--; }
    if (remaining === 0) break;
  }
  inv.addMod(producedModId);
  return { ok: true, producedModId };
}
