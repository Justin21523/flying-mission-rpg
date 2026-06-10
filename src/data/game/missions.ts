import type { MissionDefinition } from '../../types/game/mission';

// Seed — 3 mission templates, one per archetype (delivery / find_lost / repair). All recoverable, no
// combat. recommendedCharacterIds + recommendedAbility drive Mission Control hints (Batch 2).
export const SEED_MISSIONS: MissionDefinition[] = [
  {
    id: 'mission_parcel_run',
    nameZhTW: '包裹快遞',
    sourceConfidence: 'GameAdaptation',
    type: 'delivery',
    locationId: 'loc_brightcity',
    npcId: 'npc_postmistress',
    routeId: 'route_home_brightcity',
    difficulty: 'easy',
    weather: 'clear',
    recommendedAbility: 'lift',
    recommendedCharacterIds: ['char_jett', 'char_flip'],
    summaryZhTW: '把重要的包裹安全送到亮亮城的郵局站長手上。',
    objectives: [
      { id: 'obj_carry_parcel', kind: 'carry', descriptionZhTW: '吊運包裹到郵局', targetCount: 1 },
    ],
  },
  {
    id: 'mission_lost_kite',
    nameZhTW: '尋找遺失的風箏',
    sourceConfidence: 'GameAdaptation',
    type: 'find_lost',
    locationId: 'loc_coralisle',
    npcId: 'npc_beachkid',
    difficulty: 'normal',
    weather: 'wind',
    recommendedAbility: 'scan',
    recommendedCharacterIds: ['char_paul', 'char_chase'],
    summaryZhTW: '海風把小沙的風箏吹散了,幫忙找回散落的三塊碎片。',
    objectives: [
      { id: 'obj_find_pieces', kind: 'find', descriptionZhTW: '找回風箏碎片', targetCount: 3 },
    ],
  },
  {
    id: 'mission_fix_beacon',
    nameZhTW: '修復燈塔信號',
    sourceConfidence: 'GameAdaptation',
    type: 'repair',
    locationId: 'loc_coralisle',
    difficulty: 'normal',
    weather: 'fog',
    recommendedAbility: 'repair',
    recommendedCharacterIds: ['char_donnie', 'char_todd'],
    summaryZhTW: '濃霧讓珊瑚島的燈塔熄滅了,重新啟動它的信號。',
    objectives: [
      { id: 'obj_activate_beacon', kind: 'activate', descriptionZhTW: '啟動燈塔信號', targetCount: 1 },
    ],
  },
];
