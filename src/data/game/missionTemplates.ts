import type { MissionTemplate } from '../../types/game/mission';

// Batch 10 — rule-based mission generator TEMPLATES. These are generation RULES (not authored missions): the
// generator picks one per the type pool, fills it from the live editable pools (locations / NPCs / routes /
// characters / destination parts), and emits a validated MissionDefinition. Objective recipes bind to the
// shared destination-part pool by `partKind`. Tunable here; a template editor is deferred (see DEFERRED_WORK).
export const MISSION_TEMPLATES: MissionTemplate[] = [
  {
    id: 'tpl_delivery',
    type: 'delivery',
    weight: 1,
    namePatterns: ['{place} Parcel Run', 'Special Delivery to {place}', '{place} Express Drop'],
    summaryPatterns: ['Carry the parcel to {place} and drop it at the marked zone.', 'A package needs a fast, careful delivery to {place}.'],
    difficultyWeights: { easy: 3, normal: 3, hard: 1 },
    weatherWeights: { clear: 3, cloudy: 2, wind: 1, rain: 1 },
    objectives: [
      { kind: 'carry', partKind: 'carry_item', needsDropoff: true, countRange: [1, 1] },
    ],
    coinsBase: 30,
    extraReward: { type: 'trust', amount: 1 },
  },
  {
    id: 'tpl_find_lost',
    type: 'find_lost',
    weight: 1,
    namePatterns: ['Lost & Found at {place}', '{place} Search Patrol', 'Find It Near {place}'],
    summaryPatterns: ['Search around {place} and recover what was lost.', 'Something went missing near {place} — track it down.'],
    difficultyWeights: { easy: 2, normal: 3, hard: 2 },
    weatherWeights: { clear: 2, cloudy: 2, fog: 2, wind: 1 },
    objectives: [
      { kind: 'find', partKind: 'lost_item', countRange: [1, 2] },
    ],
    coinsBase: 35,
  },
  {
    id: 'tpl_repair',
    type: 'repair',
    weight: 1,
    namePatterns: ['{place} Repair Job', 'Fix the {place} Device', '{place} Emergency Repairs'],
    summaryPatterns: ['Reach {place} and repair the broken device.', 'A device at {place} needs rewiring — get it working again.'],
    difficultyWeights: { normal: 3, hard: 3, expert: 1 },
    weatherWeights: { clear: 2, cloudy: 2, rain: 2, storm: 1 },
    objectives: [
      { kind: 'activate', partKind: 'repair_device', needsMiniGame: true, countRange: [1, 1] },
    ],
    coinsBase: 45,
    extraReward: { type: 'trust', amount: 2 },
  },
  // Post-13 — extra variety within the existing types/part-pools (multi-objective combos), so the generator
  // produces a richer mix. New MissionType enums (escort/scout…) are deferred (need new destination parts).
  {
    id: 'tpl_double_delivery',
    type: 'delivery',
    weight: 1,
    namePatterns: ['{place} Double Drop', 'Two-Parcel Rush to {place}', '{place} Bulk Delivery'],
    summaryPatterns: ['Carry both parcels to {place} and drop them at the marked zone.', 'A busy day — two packages need delivering to {place}.'],
    difficultyWeights: { normal: 3, hard: 2 },
    weatherWeights: { clear: 3, cloudy: 2, wind: 1 },
    objectives: [
      { kind: 'carry', partKind: 'carry_item', needsDropoff: true, countRange: [2, 2] },
    ],
    coinsBase: 45,
    extraReward: { type: 'trust', amount: 1 },
  },
  {
    id: 'tpl_search_and_carry',
    type: 'find_lost',
    weight: 1,
    namePatterns: ['{place} Search & Recover', 'Recover & Return at {place}', '{place} Find-and-Carry'],
    summaryPatterns: ['Find what was lost near {place}, then carry it back to the drop-off.', 'Track down the missing item at {place} and bring it home.'],
    difficultyWeights: { normal: 3, hard: 2 },
    weatherWeights: { clear: 2, cloudy: 2, fog: 2 },
    objectives: [
      { kind: 'find', partKind: 'lost_item', countRange: [1, 1] },
      { kind: 'carry', partKind: 'carry_item', needsDropoff: true, countRange: [1, 1] },
    ],
    coinsBase: 50,
    extraReward: { type: 'trust', amount: 2 },
  },
  {
    id: 'tpl_repair_and_find',
    type: 'repair',
    weight: 1,
    namePatterns: ['{place} Service Call', 'Fix & Find at {place}', '{place} Maintenance Run'],
    summaryPatterns: ['Repair the device at {place} and recover the missing part.', 'A repair at {place} also needs a lost component tracked down.'],
    difficultyWeights: { hard: 3, expert: 1 },
    weatherWeights: { clear: 2, cloudy: 2, rain: 1 },
    objectives: [
      { kind: 'activate', partKind: 'repair_device', needsMiniGame: true, countRange: [1, 1] },
      { kind: 'find', partKind: 'lost_item', countRange: [1, 1] },
    ],
    coinsBase: 60,
    extraReward: { type: 'unlockTool' },
  },
];
