import type { EnemySpawnGroupDefinition } from '../../types/game/combat';

const ZONE = 'zone_sunny_harbor_advanced_foundation';

// Segment-linked enemy encounters for the seed zone (Batch C). Spawned on segment-enter by ZoneEncounterHost;
// completeWhenAllDefeated drives the segment's defeat-enemy-group condition.
export const SEED_ENEMY_SPAWN_GROUPS: EnemySpawnGroupDefinition[] = [
  {
    id: 'signal_yard_wave_01',
    zoneId: ZONE,
    segmentId: 'seg_signal_yard',
    spawnMode: 'on-segment-enter',
    enemies: [
      { enemyDefinitionId: 'crusher_drone', count: 1, formation: 'cluster' },
      { enemyDefinitionId: 'pulse_turret', count: 1, formation: 'line' },
    ],
    completeWhenAllDefeated: true,
    enabled: true,
  },
  {
    id: 'harbor_core_wave_01',
    zoneId: ZONE,
    segmentId: 'seg_harbor_core',
    spawnMode: 'on-segment-enter',
    enemies: [{ enemyDefinitionId: 'shield_carrier', count: 1, formation: 'cluster' }],
    completeWhenAllDefeated: true,
    enabled: true,
  },
  // Batch I — minions the Spawner Bug summons (debug-only; not auto-spawned on segment enter).
  {
    id: 'glitch_swarm',
    zoneId: ZONE,
    segmentId: 'seg_glitch_hive',
    spawnMode: 'debug-only',
    enemies: [{ enemyDefinitionId: 'zip_glitch', count: 2, formation: 'circle' }],
    completeWhenAllDefeated: true,
    enabled: true,
  },
  // Batch I — the new boss's summon wave (mixes the new archetypes).
  {
    id: 'glitch_hive_wave_01',
    zoneId: ZONE,
    segmentId: 'seg_glitch_hive',
    spawnMode: 'on-segment-enter',
    enemies: [
      { enemyDefinitionId: 'zip_glitch', count: 2, formation: 'circle' },
      { enemyDefinitionId: 'quake_walker', count: 1, formation: 'cluster' },
    ],
    completeWhenAllDefeated: true,
    enabled: true,
  },
];
