import type { EquipmentModRarity } from '../../types/game/equipmentMod';

// Wave 5 — equipment-mod fusion recipes: spend N owned mods of one rarity (+ coins) to craft a random mod of
// the next rarity. Editable in the ⬆ Progression tab.
export interface EquipmentFusionRecipe {
  id: string;
  name: string;
  inputRarity: EquipmentModRarity;
  inputCount: number;
  outputRarity: EquipmentModRarity;
  coinCost: number;
  enabled?: boolean;
}

export const SEED_FUSION_RECIPES: EquipmentFusionRecipe[] = [
  { id: 'fuse_common_rare', name: 'Refine to Rare', inputRarity: 'common', inputCount: 3, outputRarity: 'rare', coinCost: 100, enabled: true },
  { id: 'fuse_rare_epic', name: 'Refine to Epic', inputRarity: 'rare', inputCount: 3, outputRarity: 'epic', coinCost: 300, enabled: true },
  { id: 'fuse_epic_legendary', name: 'Refine to Legendary', inputRarity: 'epic', inputCount: 3, outputRarity: 'legendary', coinCost: 700, enabled: true },
];
