import type { RandomBossPoolDefinition } from '../../types/game/randomBoss';

// Batch J seed — one random-boss pool wired to Sunny Harbor (zone_sunny_harbor_advanced_foundation via
// MissionZoneDefinition.randomBossPoolId). Candidates are the two existing data-driven bosses for that zone,
// so a random drop reuses their full phase / weakpoint / attack-pattern data. Tunable in the 👹 Boss tab.
export const SEED_RANDOM_BOSS_POOLS: RandomBossPoolDefinition[] = [
  {
    id: 'rbp_sunny_harbor',
    name: 'Sunny Harbor Random Bosses',
    enabled: true,
    candidates: [
      { bossId: 'glitch_hive_tyrant', weight: 2 },
      { bossId: 'harbor_core_sentinel', weight: 1 },
    ],
    threat: {
      perKill: 25,
      perSecond: 4,
      threshold: 100,
      cooldownSeconds: 25,
      maxPerZone: 2,
    },
    editorMeta: {
      notes: 'Threat fills ~25 per kill + 4/s; drops a weighted-random boss at 100, 25s cooldown, max 2 per visit.',
      color: '#a855f7',
    },
  },
  // Batch K — one pool per zone 2-10. Each leads with its zone's signature boss (weight 3) + a thematic
  // secondary (weight 1) from the 10-boss roster; threat tuned by zone difficulty; bossEnvironmentThemeId
  // swaps to a dramatic theme for the fight. All editable in the 👹 Boss → Random section.
  {
    id: 'rbp_downtown', name: 'Downtown Random Bosses', enabled: true,
    candidates: [{ bossId: 'gridlock_warden', weight: 3 }, { bossId: 'glitch_hive_tyrant', weight: 1 }],
    threat: { perKill: 22, perSecond: 4, threshold: 110, cooldownSeconds: 26, maxPerZone: 2 },
    bossEnvironmentThemeId: 'env_night_city_blackout',
    editorMeta: { notes: 'Gridlock Warden (downtown).', color: '#fbbf24' },
  },
  {
    id: 'rbp_factory', name: 'Factory Random Bosses', enabled: true,
    candidates: [{ bossId: 'foundry_overmind', weight: 3 }, { bossId: 'gridlock_warden', weight: 1 }],
    threat: { perKill: 22, perSecond: 4.5, threshold: 115, cooldownSeconds: 26, maxPerZone: 2 },
    bossEnvironmentThemeId: 'env_skyport_storm',
    editorMeta: { notes: 'Foundry Overmind (factory).', color: '#f97316' },
  },
  {
    id: 'rbp_tunnel', name: 'Tunnel Random Bosses', enabled: true,
    candidates: [{ bossId: 'rockfall_colossus', weight: 3 }, { bossId: 'foundry_overmind', weight: 1 }],
    threat: { perKill: 24, perSecond: 4.5, threshold: 120, cooldownSeconds: 24, maxPerZone: 2 },
    bossEnvironmentThemeId: 'env_night_city_blackout',
    editorMeta: { notes: 'Rockfall Colossus (mountain tunnel).', color: '#a16207' },
  },
  {
    id: 'rbp_skyport', name: 'Skyport Random Bosses', enabled: true,
    candidates: [{ bossId: 'glitch_hive_tyrant', weight: 2 }, { bossId: 'skybreaker_aegis', weight: 1 }, { bossId: 'skyport_warden_elite', weight: 2 }],
    threat: { perKill: 24, perSecond: 5, threshold: 120, cooldownSeconds: 24, maxPerZone: 2 },
    bossEnvironmentThemeId: 'env_night_city_blackout',
    editorMeta: { notes: 'Glitch + Skybreaker — scripted Harbor Core stays the climax.', color: '#38bdf8' },
  },
  {
    id: 'rbp_night', name: 'Night City Random Bosses', enabled: true,
    candidates: [{ bossId: 'blackout_revenant', weight: 3 }, { bossId: 'gridlock_warden', weight: 1 }],
    threat: { perKill: 24, perSecond: 5, threshold: 125, cooldownSeconds: 22, maxPerZone: 2 },
    bossEnvironmentThemeId: 'env_skyport_storm',
    editorMeta: { notes: 'Blackout Revenant (night city).', color: '#6366f1' },
  },
  {
    id: 'rbp_storm', name: 'Storm Coast Random Bosses', enabled: true,
    candidates: [{ bossId: 'tide_leviathan', weight: 3 }, { bossId: 'rockfall_colossus', weight: 1 }],
    threat: { perKill: 26, perSecond: 5, threshold: 130, cooldownSeconds: 22, maxPerZone: 2 },
    bossEnvironmentThemeId: 'env_skyport_storm',
    editorMeta: { notes: 'Tide Leviathan (storm coast).', color: '#0ea5e9' },
  },
  {
    id: 'rbp_metro', name: 'Metro Random Bosses', enabled: true,
    candidates: [{ bossId: 'labyrinth_stalker', weight: 3 }, { bossId: 'blackout_revenant', weight: 1 }],
    threat: { perKill: 26, perSecond: 5.5, threshold: 130, cooldownSeconds: 20, maxPerZone: 2 },
    bossEnvironmentThemeId: 'env_night_city_blackout',
    editorMeta: { notes: 'Labyrinth Stalker (metro).', color: '#14b8a6' },
  },
  {
    id: 'rbp_tower', name: 'Aero Tower Random Bosses', enabled: true,
    candidates: [{ bossId: 'skybreaker_aegis', weight: 3 }, { bossId: 'tide_leviathan', weight: 1 }],
    threat: { perKill: 28, perSecond: 5.5, threshold: 135, cooldownSeconds: 20, maxPerZone: 2 },
    bossEnvironmentThemeId: 'env_skyport_storm',
    editorMeta: { notes: 'Skybreaker Aegis (aero tower).', color: '#38bdf8' },
  },
  {
    id: 'rbp_finale', name: 'Vanguard Finale Random Bosses', enabled: true,
    candidates: [{ bossId: 'harbor_core_sentinel', weight: 2 }, { bossId: 'skybreaker_aegis', weight: 1 }, { bossId: 'tide_leviathan', weight: 1 }],
    threat: { perKill: 30, perSecond: 6, threshold: 140, cooldownSeconds: 18, maxPerZone: 3 },
    bossEnvironmentThemeId: 'env_night_city_blackout',
    editorMeta: { notes: 'Mixed gauntlet — scripted Vanguard Core stays the finale.', color: '#f43f5e' },
  },
];
