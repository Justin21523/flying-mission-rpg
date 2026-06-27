// Batch N — roguelite run buffs (run-scoped, reset each run). Map to the existing combat seams: damage/
// cooldown/energy multipliers (applied at cast) + maxHp/maxEnergy/heal (applied live on pick). Editable in
// the ⬆ Progression tab. value semantics per category: damage/maxHp/maxEnergy = additive; cooldown/energy =
// reduction fraction; healFull ignores value.
export type RunBuffCategory = 'damage' | 'cooldown' | 'energy' | 'maxHp' | 'maxEnergy' | 'healFull';

export const RUN_BUFF_CATEGORIES: readonly RunBuffCategory[] = ['damage', 'cooldown', 'energy', 'maxHp', 'maxEnergy', 'healFull'];

export interface RunBuffDefinition {
  id: string;
  name: string;
  description: string;
  category: RunBuffCategory;
  value: number;
  enabled?: boolean;
  editorMeta?: { icon?: string };
}

export const SEED_RUN_BUFFS: RunBuffDefinition[] = [
  { id: 'buff_power', name: 'Overcharged Strikes', description: '+20% skill damage', category: 'damage', value: 0.2, enabled: true, editorMeta: { icon: '🔥' } },
  { id: 'buff_rapid', name: 'Rapid Systems', description: '-15% skill cooldowns', category: 'cooldown', value: 0.15, enabled: true, editorMeta: { icon: '⚡' } },
  { id: 'buff_efficient', name: 'Efficient Core', description: '-20% skill energy cost', category: 'energy', value: 0.2, enabled: true, editorMeta: { icon: '🔋' } },
  { id: 'buff_armor', name: 'Reinforced Plating', description: '+40 max HP (and heal it)', category: 'maxHp', value: 40, enabled: true, editorMeta: { icon: '🛡' } },
  { id: 'buff_capacitor', name: 'Expanded Capacitor', description: '+30 max energy', category: 'maxEnergy', value: 30, enabled: true, editorMeta: { icon: '🔌' } },
  { id: 'buff_repair', name: 'Field Repair', description: 'Fully restore HP now', category: 'healFull', value: 1, enabled: true, editorMeta: { icon: '➕' } },
];
