import type { MissionZoneDefinition, ZoneSegmentDefinition } from '../../types/game/advancedMissionZone';

// Seed Advanced Mission Zone (New Batch A) — turns the Sunny Harbor landing area into a 5-segment
// progression. Markers sit on top of the existing 'aero_destination' layout (dst_* parts). The repair
// segment reuses the REAL mission objective `obj_fix_beacon` (Phaser mini-game `repair_wiring`) so the
// objective/Phaser seam is exercised end-to-end. Everything here is editable in the 🎯 Mission Zone tab.

export const SEED_ZONE_SEGMENTS: ZoneSegmentDefinition[] = [
  {
    id: 'seg_landing_dock',
    zoneId: 'zone_sunny_harbor_advanced_foundation',
    name: 'Landing Dock',
    description: 'Touch down and move off the pad to the dock.',
    order: 1,
    segmentType: 'landing',
    bounds: { center: [0, 0, 4], size: [24, 8, 24] },
    entryConditions: [{ id: 'enter_landing', type: 'always' }],
    completionConditions: [{ id: 'reach_dock', type: 'reach-marker', markerId: 'dock_marker', radius: 4 }],
    nextSegmentIds: ['seg_cargo_street'],
    allowBacktracking: false,
    markers: [{ id: 'dock_marker', type: 'entry', label: 'Dock', position: [0, 0, 9], radius: 4, color: '#34d399' }],
    enabled: true,
  },
  {
    id: 'seg_cargo_street',
    zoneId: 'zone_sunny_harbor_advanced_foundation',
    name: 'Cargo Street',
    description: 'Activate the road control switch to clear the cargo street.',
    order: 2,
    segmentType: 'exploration',
    bounds: { center: [0, 0, 24], size: [16, 8, 40] },
    entryConditions: [{ id: 'enter_cargo', type: 'segment-completed', segmentId: 'seg_landing_dock' }],
    completionConditions: [
      { id: 'use_switch', type: 'interact-with-object', objectId: 'road_control_switch' },
      { id: 'break_wall', type: 'destroy-obstacle', obstacleId: 'cracked_wall_01' },
      // Batch G — an AI road-accident incident is generated on segment enter; resolve it to finish the segment.
      { id: 'resolve_cargo_incident', type: 'resolve-incident', incidentId: 'incident_seg_cargo_street' },
    ],
    nextSegmentIds: ['seg_signal_yard'],
    previousSegmentIds: ['seg_landing_dock'],
    allowBacktracking: true,
    placeholderObstacleIds: ['cracked_wall_01'],
    incidentTemplateIds: ['tmpl_road_accident'],
    aiIncidentHooks: { onSegmentEnter: ['tmpl_road_accident'] },
    markers: [{ id: 'road_control_switch', type: 'objective', label: 'Road Control (E)', position: [0, 0, 22], radius: 4, color: '#fbbf24' }],
    enabled: true,
  },
  {
    id: 'seg_signal_yard',
    zoneId: 'zone_sunny_harbor_advanced_foundation',
    name: 'Signal Yard',
    description: 'Secure the signal yard. (Placeholder for future combat — enter the area to clear it.)',
    order: 3,
    segmentType: 'combat-placeholder',
    bounds: { center: [22, 0, -12], size: [20, 8, 20] },
    entryConditions: [{ id: 'enter_yard', type: 'segment-completed', segmentId: 'seg_cargo_street' }],
    completionConditions: [{ id: 'clear_yard', type: 'defeat-enemy-group', enemyGroupId: 'signal_yard_wave_01' }],
    nextSegmentIds: ['seg_glitch_hive'],
    previousSegmentIds: ['seg_cargo_street'],
    allowBacktracking: true,
    placeholderEnemyGroupIds: ['signal_yard_wave_01'],
    markers: [{ id: 'signal_yard_area', type: 'objective', label: 'Signal Yard', position: [22, 0, -12], radius: 6, color: '#f87171' }],
    enabled: true,
  },
  // Batch I — second boss segment (Glitch Hive Tyrant), inserted between Signal Yard and Repair Plaza.
  {
    id: 'seg_glitch_hive',
    zoneId: 'zone_sunny_harbor_advanced_foundation',
    name: 'Glitch Hive',
    description: 'Defeat the Glitch Hive Tyrant to clear the way to the Repair Plaza.',
    order: 3.5,
    segmentType: 'boss',
    bounds: { center: [22, 0, -36], size: [24, 8, 24] },
    entryConditions: [{ id: 'enter_hive', type: 'segment-completed', segmentId: 'seg_signal_yard' }],
    completionConditions: [{ id: 'defeat_hive', type: 'defeat-boss', bossId: 'glitch_hive_tyrant' }],
    nextSegmentIds: ['seg_repair_plaza'],
    previousSegmentIds: ['seg_signal_yard'],
    allowBacktracking: true,
    placeholderEnemyGroupIds: ['glitch_hive_wave_01'],
    markers: [{ id: 'glitch_hive_terminal', type: 'core', label: 'Glitch Hive Arena', position: [22, 0, -36], radius: 4, color: '#84cc16' }],
    enabled: true,
  },
  {
    id: 'seg_repair_plaza',
    zoneId: 'zone_sunny_harbor_advanced_foundation',
    name: 'Repair Plaza',
    description: 'Rewire the harbor beacon (existing repair mini-game).',
    order: 4,
    segmentType: 'repair',
    bounds: { center: [-6, 0, -28], size: [20, 8, 20] },
    entryConditions: [{ id: 'enter_plaza', type: 'segment-completed', segmentId: 'seg_glitch_hive' }],
    completionConditions: [
      { id: 'repair_device', type: 'repair-device', deviceId: 'corrupted_device_01' },
      // Batch G — an AI mechanical-failure incident is generated on segment enter; resolve it to finish.
      { id: 'resolve_plaza_incident', type: 'resolve-incident', incidentId: 'incident_seg_repair_plaza' },
    ],
    nextSegmentIds: ['seg_harbor_core'],
    previousSegmentIds: ['seg_glitch_hive'],
    allowBacktracking: true,
    placeholderObstacleIds: ['corrupted_device_01'],
    incidentTemplateIds: ['tmpl_mechanical_failure'],
    aiIncidentHooks: { onSegmentEnter: ['tmpl_mechanical_failure'] },
    objectiveIds: ['obj_fix_beacon'],
    markers: [{ id: 'beacon_spot', type: 'objective', label: 'Harbor Beacon', position: [-6, 0, -28], radius: 5, color: '#38bdf8' }],
    enabled: true,
    // Batch E — the Corrupted Device repair can be completed three ways (support is OPTIONAL, not required):
    //   1. Donnie's own Repair Beam kit skill, 2. Donnie Repair Support, 3. Paul Shield Support to cover the
    // repair. `repair-device` is satisfied whoever repairs it (ObstacleDirector.repairedObstacleIds).
    editorMeta: { authorNotes: 'Support-friendly: Repair Support repairs the device; Shield Support can protect the repair (support_protect area).' },
  },
  {
    id: 'seg_harbor_core',
    zoneId: 'zone_sunny_harbor_advanced_foundation',
    name: 'Harbor Core',
    description: 'Defeat the Harbor Core Sentinel to complete the mission.',
    order: 5,
    // Batch F — this is now the Boss Arena. The summon wave (harbor_core_wave_01) is the Sentinel's phase-2
    // wave and the energy barrier (energy_barrier_01) its phase-1 linked shield obstacle.
    segmentType: 'boss',
    bounds: { center: [16, 0, 8], size: [24, 8, 24] },
    entryConditions: [{ id: 'enter_core', type: 'segment-completed', segmentId: 'seg_repair_plaza' }],
    completionConditions: [
      { id: 'defeat_sentinel', type: 'defeat-boss', bossId: 'harbor_core_sentinel' },
    ],
    nextSegmentIds: [],
    previousSegmentIds: ['seg_repair_plaza'],
    final: true,
    placeholderObstacleIds: ['energy_barrier_01'],
    markers: [{ id: 'harbor_core_terminal', type: 'core', label: 'Harbor Core Arena', position: [16, 0, 8], radius: 4, color: '#38bdf8' }],
    enabled: true,
  },
];

export const SEED_MISSION_ZONES: MissionZoneDefinition[] = [
  {
    id: 'zone_sunny_harbor_advanced_foundation',
    locationId: 'loc_sunnyharbor',
    name: 'Sunny Harbor Advanced Zone',
    description: 'A six-segment advanced mission zone foundation for Sunny Harbor.',
    segmentIds: ['seg_landing_dock', 'seg_cargo_street', 'seg_signal_yard', 'seg_glitch_hive', 'seg_repair_plaza', 'seg_harbor_core'],
    startSegmentId: 'seg_landing_dock',
    finalSegmentIds: ['seg_harbor_core'],
    zoneMode: 'semi-linear',
    allowBacktracking: true,
    linkedDestinationLayoutId: 'aero_destination',
    recommendedRoleTags: ['rescue', 'engineer'],
    enabled: true,
    editorMeta: { difficulty: 'normal', themeColor: '#38bdf8', tags: ['foundation', 'sunny-harbor'] },
  },
];
