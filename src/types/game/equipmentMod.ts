// Wave 3 — Equipment Mods. Per-character, persistent loadout pieces that multiply a character's skill output.
// Mirrors the run-buff model (additive value aggregated into a multiplier) but is per-character + saved, and
// plugs into the SAME cast-time multiplier seam as skill upgrades + run buffs (CharacterSkillKitDirector).
export type EquipmentModCategory = 'damage' | 'cooldown' | 'energy';

export const EQUIPMENT_MOD_CATEGORIES: readonly EquipmentModCategory[] = ['damage', 'cooldown', 'energy'];

export const MAX_MODS_PER_CHARACTER = 3;

// Wave 4 — rarity drives drop odds + UI colour. Commons are owned by default; rarer mods are earned via drops.
export type EquipmentModRarity = 'common' | 'rare' | 'epic' | 'legendary';
export const EQUIPMENT_MOD_RARITIES: readonly EquipmentModRarity[] = ['common', 'rare', 'epic', 'legendary'];
export const RARITY_COLOR: Record<EquipmentModRarity, string> = { common: '#94a3b8', rare: '#38bdf8', epic: '#a855f7', legendary: '#f59e0b' };

export interface EquipmentModDefinition {
  id: string;
  name: string;
  description: string;
  category: EquipmentModCategory;
  value: number; // additive: damage = +fraction; cooldown/energy = fractional reduction
  rarity?: EquipmentModRarity; // Wave 4 (default 'common')
  dropWeight?: number; // Wave 4 — relative weight within its rarity bucket (default 1)
  enabled?: boolean;
  editorMeta?: { icon?: string };
}
