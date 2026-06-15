import type { CombatStatsPreset } from '../../types/game/combat';

// Default player combat stat presets (editor collection). `default` is the fallback applied to any
// character without a specific preset; per-character presets override it. Character ids match the seeded
// roster (src/data/game/characters.ts): char_jett / char_donnie / char_paul / ...
export const SEED_COMBAT_STATS: CombatStatsPreset[] = [
  {
    id: 'combat_stats_default',
    characterId: 'default',
    maxHp: 100,
    maxShield: 50,
    shieldRegenPerSecond: 5,
    shieldRegenDelaySeconds: 3,
    maxEnergy: 100,
    energyRegenPerSecond: 8,
    staggerResistance: 0,
    moveSpeedMultiplier: 1,
    editorMeta: { displayName: 'Default', notes: 'Fallback stats for any character.' },
  },
  {
    id: 'combat_stats_jett',
    characterId: 'char_jett',
    maxHp: 100,
    maxShield: 50,
    shieldRegenPerSecond: 6,
    shieldRegenDelaySeconds: 2.5,
    maxEnergy: 110,
    energyRegenPerSecond: 9,
    staggerResistance: 0,
    moveSpeedMultiplier: 1.05,
    editorMeta: { displayName: 'Jett', notes: 'Speedy — slightly higher energy + move speed.' },
  },
];
