import type { MissionDefinition } from '../../types/game/mission';

// Seed — 3 mission templates, one per archetype (delivery / find_lost / repair). All recoverable, no
// combat. recommendedCharacterIds + recommendedAbility drive Mission Control hints. English display text.
export const SEED_MISSIONS: MissionDefinition[] = [
  {
    id: 'mission_parcel_run',
    name: 'Sunny Harbor Helper',
    sourceConfidence: 'GameAdaptation',
    type: 'delivery',
    locationId: 'loc_sunnyharbor',
    npcId: 'npc_mina',
    routeId: 'route_home_sunnyharbor',
    difficulty: 'easy',
    weather: 'clear',
    recommendedAbility: 'lift',
    recommendedCharacterIds: ['char_jett', 'char_flip'],
    summary: 'Help Mina around Sunny Harbor: deliver the parcel, find the lost cap and fix the beacon.',
    objectives: [
      { id: 'obj_carry_parcel', kind: 'carry', description: 'Carry the parcel to the post office dropoff', targetCount: 1, targetObjectIds: ['dst_parcel'], dropoffZoneId: 'dst_dropoff', hintText: 'The parcel sits by the harbor road.' },
      { id: 'obj_find_cap', kind: 'find', description: 'Find the lost cap near the lighthouse', targetCount: 1, targetObjectIds: ['dst_lost_cap'], hintText: 'Look around the lighthouse side of the harbor.' },
      { id: 'obj_fix_beacon', kind: 'activate', description: 'Rewire the harbor beacon (mini-game)', targetCount: 1, targetObjectIds: ['dst_beacon'], miniGameId: 'repair_wiring', hintText: 'The beacon is at the lighthouse base.' },
    ],
  },
  {
    id: 'mission_lost_kite',
    name: 'The Lost Kite',
    sourceConfidence: 'GameAdaptation',
    type: 'find_lost',
    locationId: 'loc_coralisle',
    npcId: 'npc_beachkid',
    routeId: 'route_home_mountaintown',
    difficulty: 'normal',
    weather: 'wind',
    recommendedAbility: 'scan',
    recommendedCharacterIds: ['char_paul', 'char_chase'],
    summary: "The sea wind scattered Sandy's kite — help find the three lost pieces.",
    objectives: [{ id: 'obj_find_pieces', kind: 'find', description: 'Find the kite pieces', targetCount: 3 }],
  },
  {
    id: 'mission_fix_beacon',
    name: 'Fix the Beacon',
    sourceConfidence: 'GameAdaptation',
    type: 'repair',
    locationId: 'loc_coralisle',
    routeId: 'route_home_stormcoast',
    difficulty: 'normal',
    weather: 'fog',
    recommendedAbility: 'repair',
    recommendedCharacterIds: ['char_donnie', 'char_todd'],
    summary: "Thick fog left Coral Isle's lighthouse dark — restart its beacon signal.",
    objectives: [{ id: 'obj_activate_beacon', kind: 'activate', description: 'Restart the lighthouse beacon', targetCount: 1 }],
  },
];
