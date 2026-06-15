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
];
