import type { BossSummonWaveDefinition } from '../../types/game/boss';

// Harbor Core Sentinel summon wave (Batch F). Reuses the existing seeded `harbor_core_wave_01` enemy spawn
// group (Crusher/Turret) through EnemySpawnDirector — no new enemies.
export const SEED_BOSS_SUMMON_WAVES: BossSummonWaveDefinition[] = [
  {
    id: 'wave_harbor_summon',
    bossId: 'harbor_core_sentinel',
    phaseId: 'phase_harbor_p2',
    enemySpawnGroupIds: ['harbor_core_wave_01'],
    trigger: { type: 'on-phase-start' },
    maxActiveEnemies: 6,
    completeWhenGroupsCleared: true,
  },
  // Batch I — Glitch Hive Tyrant summon wave (the new zip + quake archetypes).
  {
    id: 'wave_glitch_summon',
    bossId: 'glitch_hive_tyrant',
    phaseId: 'phase_glitch_p2',
    enemySpawnGroupIds: ['glitch_hive_wave_01'],
    trigger: { type: 'on-phase-start' },
    maxActiveEnemies: 6,
    completeWhenGroupsCleared: true,
  },
];
