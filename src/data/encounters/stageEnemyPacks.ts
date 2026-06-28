import type { EnemySpawnGroupDefinition } from '../../types/game/combat';

// Batch K — per-zone landing ambush waves (zones 2-10). Spawn on entering each zone's START segment so
// landing drops straight into combat (zone.autoCombatOnLanding); clearing the wave completes the segment.
const LANDING_AMBUSHES: EnemySpawnGroupDefinition[] = [
  { id: 'downtown_landing_ambush', zoneId: 'zone_downtown_traffic_collapse', segmentId: 'seg_downtown_arrival', spawnMode: 'on-segment-enter', enemies: [{ enemyDefinitionId: 'crusher_drone', count: 2, formation: 'circle' }, { enemyDefinitionId: 'shield_carrier', count: 1, formation: 'cluster' }], completeWhenAllDefeated: true, enabled: true },
  { id: 'factory_landing_ambush', zoneId: 'zone_factory_core_breakdown', segmentId: 'seg_factory_entry', spawnMode: 'on-segment-enter', enemies: [{ enemyDefinitionId: 'glitch_spawner', count: 1, formation: 'line' }, { enemyDefinitionId: 'drone_swarm', count: 2, formation: 'circle' }], completeWhenAllDefeated: true, enabled: true },
  { id: 'tunnel_landing_ambush', zoneId: 'zone_mountain_tunnel_rescue', segmentId: 'seg_tunnel_entrance', spawnMode: 'on-segment-enter', enemies: [{ enemyDefinitionId: 'quake_walker', count: 1, formation: 'cluster' }, { enemyDefinitionId: 'crusher_drone', count: 2, formation: 'circle' }], completeWhenAllDefeated: true, enabled: true },
  { id: 'skyport_landing_ambush', zoneId: 'zone_skyport_core_finale', segmentId: 'seg_skyport_drop', spawnMode: 'on-segment-enter', enemies: [{ enemyDefinitionId: 'zip_glitch', count: 2, formation: 'circle' }, { enemyDefinitionId: 'pulse_turret', count: 1, formation: 'cluster' }], completeWhenAllDefeated: true, enabled: true },
  { id: 'blackout_landing_ambush', zoneId: 'zone_night_city_blackout', segmentId: 'seg_blackout_arrival', spawnMode: 'on-segment-enter', enemies: [{ enemyDefinitionId: 'pulse_turret', count: 2, formation: 'line' }, { enemyDefinitionId: 'drone_swarm', count: 1, formation: 'circle' }], completeWhenAllDefeated: true, enabled: true },
  { id: 'flood_landing_ambush', zoneId: 'zone_storm_coast_flood_rescue', segmentId: 'seg_flood_landing', spawnMode: 'on-segment-enter', enemies: [{ enemyDefinitionId: 'drone_swarm', count: 3, formation: 'circle' }, { enemyDefinitionId: 'repair_wisp', count: 1, formation: 'cluster' }], completeWhenAllDefeated: true, enabled: true },
  { id: 'metro_landing_ambush', zoneId: 'zone_metro_rescue_labyrinth', segmentId: 'seg_metro_entry', spawnMode: 'on-segment-enter', enemies: [{ enemyDefinitionId: 'zip_glitch', count: 2, formation: 'circle' }, { enemyDefinitionId: 'shield_carrier', count: 1, formation: 'cluster' }], completeWhenAllDefeated: true, enabled: true },
  { id: 'tower_landing_ambush', zoneId: 'zone_aero_tower_high_rescue', segmentId: 'seg_tower_base', spawnMode: 'on-segment-enter', enemies: [{ enemyDefinitionId: 'zip_glitch', count: 2, formation: 'circle' }, { enemyDefinitionId: 'barrier_node', count: 1, formation: 'cluster' }], completeWhenAllDefeated: true, enabled: true },
  { id: 'finale_landing_ambush', zoneId: 'zone_rescue_vanguard_finale', segmentId: 'seg_finale_arrival', spawnMode: 'on-segment-enter', enemies: [{ enemyDefinitionId: 'elite_sentinel', count: 1, formation: 'cluster' }, { enemyDefinitionId: 'zip_glitch', count: 2, formation: 'circle' }], completeWhenAllDefeated: true, enabled: true },
];

// Batch O — mission-type demo groups. defense-waves spawns these sequentially; scan-targets spawns the scan
// group. spawnMode 'debug-only' so only the MissionObjectiveHost spawns them (not on segment-enter).
const MISSION_TYPE_GROUPS: EnemySpawnGroupDefinition[] = [
  { id: 'downtown_def_wave_1', zoneId: 'zone_downtown_traffic_collapse', segmentId: 'seg_downtown_evac', spawnMode: 'debug-only', enemies: [{ enemyDefinitionId: 'crusher_drone', count: 3, formation: 'circle' }], completeWhenAllDefeated: true, enabled: true },
  { id: 'downtown_def_wave_2', zoneId: 'zone_downtown_traffic_collapse', segmentId: 'seg_downtown_evac', spawnMode: 'debug-only', enemies: [{ enemyDefinitionId: 'zip_glitch', count: 2, formation: 'circle' }, { enemyDefinitionId: 'pulse_turret', count: 1, formation: 'cluster' }], completeWhenAllDefeated: true, enabled: true },
  { id: 'downtown_def_wave_3', zoneId: 'zone_downtown_traffic_collapse', segmentId: 'seg_downtown_evac', spawnMode: 'debug-only', enemies: [{ enemyDefinitionId: 'quake_walker', count: 1, formation: 'cluster' }, { enemyDefinitionId: 'drone_swarm', count: 2, formation: 'circle' }], completeWhenAllDefeated: true, enabled: true },
  { id: 'blackout_scan_group', zoneId: 'zone_night_city_blackout', segmentId: 'seg_blackout_scan', spawnMode: 'debug-only', enemies: [{ enemyDefinitionId: 'pulse_turret', count: 3, formation: 'line' }], completeWhenAllDefeated: true, enabled: true },
];

// World-build Wave 1 — themed extra-threat packs for the 3 new enemies (new ids → mergeMissingFromSeed; spawn
// alongside each zone's landing ambush, not gating completion).
const WORLDBUILD_W1_GROUPS: EnemySpawnGroupDefinition[] = [
  { id: 'tower_owl_flock', zoneId: 'zone_aero_tower_high_rescue', segmentId: 'seg_tower_base', spawnMode: 'on-segment-enter', enemies: [{ enemyDefinitionId: 'owl_scout', count: 3, formation: 'circle' }], completeWhenAllDefeated: false, enabled: true },
  { id: 'tunnel_frost_den', zoneId: 'zone_mountain_tunnel_rescue', segmentId: 'seg_tunnel_entrance', spawnMode: 'on-segment-enter', enemies: [{ enemyDefinitionId: 'frost_stalker', count: 2, formation: 'circle' }], completeWhenAllDefeated: false, enabled: true },
  { id: 'finale_demon_crew', zoneId: 'zone_rescue_vanguard_finale', segmentId: 'seg_finale_arrival', spawnMode: 'on-segment-enter', enemies: [{ enemyDefinitionId: 'demon_brute', count: 1, formation: 'cluster' }, { enemyDefinitionId: 'frost_stalker', count: 1, formation: 'circle' }], completeWhenAllDefeated: false, enabled: true },
];

const RAW_STAGE_GROUPS: EnemySpawnGroupDefinition[] = [
  ...LANDING_AMBUSHES,
  ...MISSION_TYPE_GROUPS,
  ...WORLDBUILD_W1_GROUPS,
  {
    id: 'downtown_shield_blockade_01',
    zoneId: 'zone_downtown_traffic_collapse',
    segmentId: 'seg_downtown_intersection',
    spawnMode: 'on-segment-enter',
    enemies: [
      { enemyDefinitionId: 'shield_carrier', count: 1, formation: 'line' },
      { enemyDefinitionId: 'pulse_turret', count: 1, formation: 'line' },
    ],
    completeWhenAllDefeated: true,
    linkedZoneConditionId: 'clear_downtown_shields',
    enabled: true,
  },
  {
    id: 'downtown_swarm_evac_01',
    zoneId: 'zone_downtown_traffic_collapse',
    segmentId: 'seg_downtown_evac',
    spawnMode: 'on-segment-enter',
    enemies: [
      { enemyDefinitionId: 'drone_swarm', count: 3, formation: 'circle' },
      { enemyDefinitionId: 'barrier_node', count: 1, formation: 'cluster' },
    ],
    completeWhenAllDefeated: true,
    linkedZoneConditionId: 'clear_evac_swarm',
    enabled: true,
  },
  {
    id: 'factory_repair_support_01',
    zoneId: 'zone_factory_core_breakdown',
    segmentId: 'seg_factory_assembly',
    spawnMode: 'on-segment-enter',
    enemies: [
      { enemyDefinitionId: 'repair_wisp', count: 1, formation: 'circle' },
      { enemyDefinitionId: 'glitch_spawner', count: 1, formation: 'cluster' },
    ],
    completeWhenAllDefeated: true,
    linkedZoneConditionId: 'clear_factory_support',
    enabled: true,
  },
  {
    id: 'factory_hazard_core_01',
    zoneId: 'zone_factory_core_breakdown',
    segmentId: 'seg_factory_hazard',
    spawnMode: 'on-segment-enter',
    enemies: [
      { enemyDefinitionId: 'hazard_core', count: 1, formation: 'cluster' },
      { enemyDefinitionId: 'drone_swarm', count: 2, formation: 'circle' },
    ],
    completeWhenAllDefeated: true,
    linkedZoneConditionId: 'disable_hazard_core',
    enabled: true,
  },
  {
    id: 'factory_elite_sentinel_01',
    zoneId: 'zone_factory_core_breakdown',
    segmentId: 'seg_factory_control',
    spawnMode: 'on-segment-enter',
    enemies: [{ enemyDefinitionId: 'elite_sentinel', count: 1, formation: 'cluster' }],
    completeWhenAllDefeated: true,
    linkedZoneConditionId: 'clear_factory_elite',
    enabled: true,
  },
  {
    id: 'tunnel_quake_blockade_01',
    zoneId: 'zone_mountain_tunnel_rescue',
    segmentId: 'seg_tunnel_collapse',
    spawnMode: 'on-segment-enter',
    enemies: [
      { enemyDefinitionId: 'quake_walker', count: 1, formation: 'cluster' },
      { enemyDefinitionId: 'crusher_drone', count: 1, formation: 'line' },
    ],
    completeWhenAllDefeated: true,
    linkedZoneConditionId: 'clear_quake_blockade',
    enabled: true,
  },
  {
    id: 'tunnel_sniper_exit_01',
    zoneId: 'zone_mountain_tunnel_rescue',
    segmentId: 'seg_tunnel_exit',
    spawnMode: 'on-segment-enter',
    enemies: [
      { enemyDefinitionId: 'sniper_node', count: 2, formation: 'line' },
      { enemyDefinitionId: 'elite_sentinel', count: 1, formation: 'cluster' },
    ],
    completeWhenAllDefeated: true,
    linkedZoneConditionId: 'clear_tunnel_exit',
    enabled: true,
  },
  {
    id: 'skyport_bridge_patrol_01',
    zoneId: 'zone_skyport_core_finale',
    segmentId: 'seg_skyport_bridge',
    spawnMode: 'on-segment-enter',
    enemies: [
      { enemyDefinitionId: 'zip_glitch', count: 2, formation: 'circle' },
      { enemyDefinitionId: 'shield_carrier', count: 1, formation: 'line' },
    ],
    completeWhenAllDefeated: true,
    linkedZoneConditionId: 'clear_skyport_bridge',
    enabled: true,
  },
  {
    id: 'skyport_boss_minions_01',
    zoneId: 'zone_skyport_core_finale',
    segmentId: 'seg_skyport_core',
    spawnMode: 'on-segment-enter',
    enemies: [
      { enemyDefinitionId: 'shield_carrier', count: 1, formation: 'line' },
      { enemyDefinitionId: 'zip_glitch', count: 1, formation: 'circle' },
    ],
    completeWhenAllDefeated: true,
    linkedZoneConditionId: 'clear_skyport_minions',
    enabled: true,
  },
  {
    id: 'blackout_turret_scan_01',
    zoneId: 'zone_night_city_blackout',
    segmentId: 'seg_blackout_scan',
    spawnMode: 'on-segment-enter',
    enemies: [
      { enemyDefinitionId: 'pulse_turret', count: 2, formation: 'line' },
      { enemyDefinitionId: 'drone_swarm', count: 2, formation: 'circle' },
    ],
    completeWhenAllDefeated: true,
    linkedZoneConditionId: 'clear_blackout_turrets',
    enabled: true,
  },
  {
    id: 'blackout_sniper_grid_01',
    zoneId: 'zone_night_city_blackout',
    segmentId: 'seg_blackout_grid',
    spawnMode: 'on-segment-enter',
    enemies: [
      { enemyDefinitionId: 'sniper_node', count: 2, formation: 'line' },
      { enemyDefinitionId: 'pulse_turret', count: 1, formation: 'cluster' },
    ],
    completeWhenAllDefeated: true,
    linkedZoneConditionId: 'clear_blackout_grid',
    enabled: true,
  },
  {
    id: 'flood_swarm_rescue_01',
    zoneId: 'zone_storm_coast_flood_rescue',
    segmentId: 'seg_flood_evac',
    spawnMode: 'on-segment-enter',
    enemies: [
      { enemyDefinitionId: 'drone_swarm', count: 4, formation: 'circle' },
      { enemyDefinitionId: 'repair_wisp', count: 1, formation: 'cluster' },
    ],
    completeWhenAllDefeated: true,
    linkedZoneConditionId: 'clear_flood_evac_swarm',
    enabled: true,
  },
  {
    id: 'flood_hazard_core_01',
    zoneId: 'zone_storm_coast_flood_rescue',
    segmentId: 'seg_flood_hazard_core',
    spawnMode: 'on-segment-enter',
    enemies: [
      { enemyDefinitionId: 'hazard_core', count: 1, formation: 'cluster' },
      { enemyDefinitionId: 'repair_wisp', count: 1, formation: 'line' },
    ],
    completeWhenAllDefeated: true,
    linkedZoneConditionId: 'clear_flood_hazard_core',
    enabled: true,
  },
  {
    id: 'metro_patrol_01',
    zoneId: 'zone_metro_rescue_labyrinth',
    segmentId: 'seg_metro_switch',
    spawnMode: 'on-segment-enter',
    enemies: [
      { enemyDefinitionId: 'zip_glitch', count: 2, formation: 'circle' },
      { enemyDefinitionId: 'shield_carrier', count: 1, formation: 'line' },
    ],
    completeWhenAllDefeated: true,
    linkedZoneConditionId: 'clear_metro_patrol',
    enabled: true,
  },
  {
    id: 'metro_ambush_01',
    zoneId: 'zone_metro_rescue_labyrinth',
    segmentId: 'seg_metro_platform',
    spawnMode: 'on-segment-enter',
    enemies: [
      { enemyDefinitionId: 'sniper_node', count: 1, formation: 'line' },
      { enemyDefinitionId: 'zip_glitch', count: 2, formation: 'circle' },
    ],
    completeWhenAllDefeated: true,
    linkedZoneConditionId: 'clear_metro_ambush',
    enabled: true,
  },
  {
    id: 'tower_platform_pressure_01',
    zoneId: 'zone_aero_tower_high_rescue',
    segmentId: 'seg_tower_platform',
    spawnMode: 'on-segment-enter',
    enemies: [
      { enemyDefinitionId: 'zip_glitch', count: 2, formation: 'circle' },
      { enemyDefinitionId: 'pulse_turret', count: 1, formation: 'line' },
    ],
    completeWhenAllDefeated: true,
    linkedZoneConditionId: 'clear_tower_platform',
    enabled: true,
  },
  {
    id: 'tower_barrier_node_01',
    zoneId: 'zone_aero_tower_high_rescue',
    segmentId: 'seg_tower_antenna',
    spawnMode: 'on-segment-enter',
    enemies: [
      { enemyDefinitionId: 'barrier_node', count: 1, formation: 'cluster' },
      { enemyDefinitionId: 'pulse_turret', count: 2, formation: 'line' },
    ],
    completeWhenAllDefeated: true,
    linkedZoneConditionId: 'clear_tower_antenna',
    enabled: true,
  },
  {
    id: 'finale_elite_guard_01',
    zoneId: 'zone_rescue_vanguard_finale',
    segmentId: 'seg_finale_elite_guard',
    spawnMode: 'on-segment-enter',
    enemies: [
      { enemyDefinitionId: 'elite_sentinel', count: 1, formation: 'cluster' },
      { enemyDefinitionId: 'barrier_node', count: 1, formation: 'line' },
      { enemyDefinitionId: 'repair_wisp', count: 1, formation: 'line' },
    ],
    completeWhenAllDefeated: true,
    linkedZoneConditionId: 'clear_finale_elite',
    enabled: true,
  },
  {
    id: 'finale_boss_support_01',
    zoneId: 'zone_rescue_vanguard_finale',
    segmentId: 'seg_finale_core',
    spawnMode: 'on-segment-enter',
    enemies: [
      { enemyDefinitionId: 'zip_glitch', count: 2, formation: 'circle' },
      { enemyDefinitionId: 'repair_wisp', count: 1, formation: 'cluster' },
      { enemyDefinitionId: 'glitch_spawner', count: 1, formation: 'line' },
    ],
    completeWhenAllDefeated: true,
    linkedZoneConditionId: 'clear_finale_support',
    enabled: true,
  },
];

// Content-fill pass — give zones 2–10 real use of Wave 1 elite affixes + Wave 2 squad AI. A group's affix
// density escalates by campaign depth; squad roles are derived from the group's enemy mix (healers hang back,
// ranged keep distance, melee swarm) and only attached when the mix is actually mixed. All additive + editable
// (these become the seed), so an authored affixPolicy/squadPolicy on a group is preserved.
const ALL_AFFIXES = ['shielded', 'volatile', 'swift', 'regenerating', 'vampiric'];
const ZONE_AFFIX_TIER: Record<string, { chance: number; max: number }> = {
  zone_downtown_traffic_collapse: { chance: 0.15, max: 1 },
  zone_factory_core_breakdown: { chance: 0.2, max: 1 },
  zone_mountain_tunnel_rescue: { chance: 0.25, max: 1 },
  zone_skyport_core_finale: { chance: 0.3, max: 1 },
  zone_night_city_blackout: { chance: 0.3, max: 1 },
  zone_storm_coast_flood_rescue: { chance: 0.35, max: 1 },
  zone_metro_rescue_labyrinth: { chance: 0.4, max: 1 },
  zone_aero_tower_high_rescue: { chance: 0.45, max: 2 },
  zone_rescue_vanguard_finale: { chance: 0.5, max: 2 },
};
const RANGED_ENEMIES = new Set(['pulse_turret', 'sniper_node', 'owl_scout', 'suppressor_node', 'glitch_spawner', 'barrier_node']);
const HEALER_ENEMIES = new Set(['repair_wisp', 'aegis_buffer']);

function roleFor(enemyId: string): 'healer-stay-back' | 'ranged-keep-distance' | 'melee-swarm' {
  if (HEALER_ENEMIES.has(enemyId)) return 'healer-stay-back';
  if (RANGED_ENEMIES.has(enemyId)) return 'ranged-keep-distance';
  return 'melee-swarm';
}

function enrichGroup(g: EnemySpawnGroupDefinition): EnemySpawnGroupDefinition {
  const totalCount = g.enemies.reduce((s, e) => s + e.count, 0);
  const tier = ZONE_AFFIX_TIER[g.zoneId] ?? { chance: 0.2, max: 1 };
  const affixPolicy = g.affixPolicy ?? (totalCount >= 2 ? { allowedAffixIds: ALL_AFFIXES, chancePerEnemy: tier.chance, maxPerEnemy: tier.max } : undefined);
  // Squad roles per distinct enemy; only attach when the mix has ≥2 distinct roles.
  const roles = [...new Set(g.enemies.map((e) => e.enemyDefinitionId))].map((id) => ({ enemyDefinitionId: id, role: roleFor(id) }));
  const distinctRoles = new Set(roles.map((r) => r.role));
  const squadPolicy = g.squadPolicy ?? (distinctRoles.size >= 2 ? { enabled: true, roles } : undefined);
  return { ...g, affixPolicy, squadPolicy };
}

export const STAGE_ENEMY_SPAWN_GROUPS: EnemySpawnGroupDefinition[] = RAW_STAGE_GROUPS.map(enrichGroup);
