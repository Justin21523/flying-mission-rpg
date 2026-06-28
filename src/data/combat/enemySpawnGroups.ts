import type { EnemySpawnGroupDefinition } from '../../types/game/combat';
import { STAGE_ENEMY_SPAWN_GROUPS } from '../encounters/stageEnemyPacks';
import { EXTRA_BOSS_SUMMON_GROUPS } from '../bosses/extraZoneBosses';

const ZONE = 'zone_sunny_harbor_advanced_foundation';

// Segment-linked enemy encounters for the seed zone (Batch C). Spawned on segment-enter by ZoneEncounterHost;
// completeWhenAllDefeated drives the segment's defeat-enemy-group condition.
export const SEED_ENEMY_SPAWN_GROUPS: EnemySpawnGroupDefinition[] = [
  // Batch J — landing ambush: spawns the moment you touch down so the zone drops straight into combat
  // (zone.autoCombatOnLanding). Clearing it completes the landing segment; the threat gauge also accrues here.
  {
    id: 'harbor_landing_ambush',
    zoneId: ZONE,
    segmentId: 'seg_landing_dock',
    spawnMode: 'on-segment-enter',
    enemies: [
      { enemyDefinitionId: 'crusher_drone', count: 2, formation: 'circle' },
      { enemyDefinitionId: 'pulse_turret', count: 1, formation: 'cluster' },
    ],
    completeWhenAllDefeated: true,
    enabled: true,
  },
  {
    id: 'signal_yard_wave_01',
    zoneId: ZONE,
    segmentId: 'seg_signal_yard',
    spawnMode: 'on-segment-enter',
    enemies: [
      { enemyDefinitionId: 'crusher_drone', count: 1, formation: 'cluster' },
    ],
    completeWhenAllDefeated: true,
    enabled: true,
  },
  // Wave 3 — guardians of the optional treasure vault branch (high-risk route off Cargo Street). Mixes Wave 2
  // tactical archetypes + a Wave 1 affix policy so the reward path actually bites.
  {
    id: 'cargo_vault_guardians',
    zoneId: ZONE,
    segmentId: 'seg_cargo_vault',
    spawnMode: 'on-segment-enter',
    enemies: [
      { enemyDefinitionId: 'shadow_flanker', count: 2, formation: 'circle' },
      { enemyDefinitionId: 'volatile_bomber', count: 1, formation: 'cluster' },
    ],
    affixPolicy: { allowedAffixIds: ['shielded', 'swift', 'regenerating', 'vampiric', 'berserk', 'summoner', 'reflect', 'teleport'], chancePerEnemy: 0.7, maxPerEnemy: 2 },
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
  ...STAGE_ENEMY_SPAWN_GROUPS,
  // Batch K — debug-only summon groups for the 7 per-zone signature bosses (triggered by their P2 waves).
  ...EXTRA_BOSS_SUMMON_GROUPS,
];
