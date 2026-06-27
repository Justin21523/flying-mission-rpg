import type { HangarUpgradeDefinition } from '../../types/game/hangarUpgrade';

// Batch L — seed Hangar upgrade nodes (editable in the 🛠 Hangar tab). Coins are earned from enemy kills +
// stage rewards. Costs are flat per level.
export const SEED_HANGAR_UPGRADES: HangarUpgradeDefinition[] = [
  { id: 'hangar_reinforced_hull', name: 'Reinforced Hull', description: '+20 max HP per level for every character.', category: 'maxHp', maxLevel: 5, perLevel: { cost: 150, value: 20 }, editorMeta: { icon: '🛡' } },
  { id: 'hangar_energy_core', name: 'Energy Core', description: '+15 max energy per level for every character.', category: 'maxEnergy', maxLevel: 5, perLevel: { cost: 120, value: 15 }, editorMeta: { icon: '⚡' } },
  { id: 'hangar_sync_amplifier', name: 'Sync Amplifier', description: '+8% partner-fusion sync gain per level.', category: 'fusionCharge', maxLevel: 5, perLevel: { cost: 180, value: 0.08 }, editorMeta: { icon: '🔗' } },
  // Wave 3 — expanded tree (all wired to real consumption points).
  { id: 'hangar_overdrive_cores', name: 'Overdrive Cores', description: '-4% skill cooldowns per level.', category: 'cooldown', maxLevel: 5, perLevel: { cost: 200, value: 0.04 }, editorMeta: { icon: '⏱' } },
  { id: 'hangar_salvage_magnet', name: 'Salvage Magnet', description: '+10% coin drops per level.', category: 'dropRate', maxLevel: 5, perLevel: { cost: 140, value: 0.1 }, editorMeta: { icon: '🧲' } },
  { id: 'hangar_aegis_plating', name: 'Aegis Plating', description: '+15 starting shield per level on combat entry.', category: 'openingShield', maxLevel: 5, perLevel: { cost: 160, value: 15 }, editorMeta: { icon: '🔰' } },
  { id: 'hangar_executioner_protocol', name: 'Executioner Protocol', description: '+20% finisher resource refund per level.', category: 'executeBonus', maxLevel: 5, perLevel: { cost: 170, value: 0.2 }, editorMeta: { icon: '🗡' } },
];
