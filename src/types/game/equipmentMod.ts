// Wave 3 — Equipment Mods. Per-character, persistent loadout pieces that multiply a character's skill output.
// Mirrors the run-buff model (additive value aggregated into a multiplier) but is per-character + saved, and
// plugs into the SAME cast-time multiplier seam as skill upgrades + run buffs (CharacterSkillKitDirector).
export type EquipmentModCategory = 'damage' | 'cooldown' | 'energy';

export const EQUIPMENT_MOD_CATEGORIES: readonly EquipmentModCategory[] = ['damage', 'cooldown', 'energy'];

export const MAX_MODS_PER_CHARACTER = 3;

export interface EquipmentModDefinition {
  id: string;
  name: string;
  description: string;
  category: EquipmentModCategory;
  value: number; // additive: damage = +fraction; cooldown/energy = fractional reduction
  enabled?: boolean;
  editorMeta?: { icon?: string };
}
