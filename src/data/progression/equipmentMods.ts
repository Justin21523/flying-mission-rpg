import type { EquipmentModDefinition } from '../../types/game/equipmentMod';

// Wave 3 — seed equipment-mod catalog (editable in the ⬆ Progression tab). Players equip up to 3 per character.
export const SEED_EQUIPMENT_MODS: EquipmentModDefinition[] = [
  // Commons — owned by default.
  { id: 'mod_power_cell_i', name: 'Power Cell I', description: '+10% skill damage.', category: 'damage', value: 0.1, rarity: 'common', enabled: true, editorMeta: { icon: '⚔' } },
  { id: 'mod_coolant_i', name: 'Coolant I', description: '-10% cooldowns.', category: 'cooldown', value: 0.1, rarity: 'common', enabled: true, editorMeta: { icon: '⏱' } },
  { id: 'mod_capacitor_i', name: 'Capacitor I', description: '-10% energy cost.', category: 'energy', value: 0.1, rarity: 'common', enabled: true, editorMeta: { icon: '🔋' } },
  { id: 'mod_field_tuner', name: 'Field Tuner', description: '-14% cooldown.', category: 'cooldown', value: 0.14, rarity: 'common', enabled: true, editorMeta: { icon: '🛠' } },
  // Rares — drop only.
  { id: 'mod_power_cell_ii', name: 'Power Cell II', description: '+20% skill damage.', category: 'damage', value: 0.2, rarity: 'rare', enabled: true, editorMeta: { icon: '⚔' } },
  { id: 'mod_coolant_ii', name: 'Coolant II', description: '-18% cooldowns.', category: 'cooldown', value: 0.18, rarity: 'rare', enabled: true, editorMeta: { icon: '⏱' } },
  { id: 'mod_capacitor_ii', name: 'Capacitor II', description: '-18% energy cost.', category: 'energy', value: 0.18, rarity: 'rare', enabled: true, editorMeta: { icon: '🔋' } },
  // Epics.
  { id: 'mod_overcharge', name: 'Overcharge', description: '+30% skill damage.', category: 'damage', value: 0.3, rarity: 'epic', enabled: true, editorMeta: { icon: '💥' } },
  { id: 'mod_chrono_core', name: 'Chrono Core', description: '-28% cooldowns.', category: 'cooldown', value: 0.28, rarity: 'epic', enabled: true, editorMeta: { icon: '⏳' } },
  // Legendary.
  { id: 'mod_singularity', name: 'Singularity Drive', description: '+45% skill damage.', category: 'damage', value: 0.45, rarity: 'legendary', enabled: true, editorMeta: { icon: '🌌' } },
];
