import type { EquipmentModDefinition } from '../../types/game/equipmentMod';

// Wave 3 — seed equipment-mod catalog (editable in the ⬆ Progression tab). Players equip up to 3 per character.
export const SEED_EQUIPMENT_MODS: EquipmentModDefinition[] = [
  { id: 'mod_power_cell_i', name: 'Power Cell I', description: '+10% skill damage.', category: 'damage', value: 0.1, enabled: true, editorMeta: { icon: '⚔' } },
  { id: 'mod_power_cell_ii', name: 'Power Cell II', description: '+20% skill damage.', category: 'damage', value: 0.2, enabled: true, editorMeta: { icon: '⚔' } },
  { id: 'mod_coolant_i', name: 'Coolant I', description: '-10% cooldowns.', category: 'cooldown', value: 0.1, enabled: true, editorMeta: { icon: '⏱' } },
  { id: 'mod_coolant_ii', name: 'Coolant II', description: '-18% cooldowns.', category: 'cooldown', value: 0.18, enabled: true, editorMeta: { icon: '⏱' } },
  { id: 'mod_capacitor_i', name: 'Capacitor I', description: '-10% energy cost.', category: 'energy', value: 0.1, enabled: true, editorMeta: { icon: '🔋' } },
  { id: 'mod_capacitor_ii', name: 'Capacitor II', description: '-18% energy cost.', category: 'energy', value: 0.18, enabled: true, editorMeta: { icon: '🔋' } },
  { id: 'mod_overcharge', name: 'Overcharge', description: '+15% damage, +10% energy cost.', category: 'damage', value: 0.15, enabled: true, editorMeta: { icon: '💥' } },
  { id: 'mod_field_tuner', name: 'Field Tuner', description: '-14% cooldown.', category: 'cooldown', value: 0.14, enabled: true, editorMeta: { icon: '🛠' } },
];
