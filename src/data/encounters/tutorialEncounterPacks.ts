import type { EncounterPackDefinition } from '../../types/encounterTypes';

export const TUTORIAL_ENCOUNTER_PACKS: EncounterPackDefinition[] = [
  { id: 'one_crusher_intro', stageId: 'stage_sunny_harbor_emergency', name: 'One Crusher Intro', encounterIds: ['enc_sunny_signal_yard'], category: 'tutorial', difficultyWeight: 1, recommendedCounterplay: ['basic attack'], stageSuitability: ['tutorial'], editorMeta: { notes: 'Single low-pressure melee lesson.' } },
  { id: 'turret_intro', stageId: 'stage_sunny_harbor_emergency', name: 'Turret Intro', encounterIds: ['enc_sunny_signal_yard'], category: 'tutorial', difficultyWeight: 1.2, recommendedCounterplay: ['move out of line', 'ranged attack'], stageSuitability: ['tutorial'], editorMeta: { notes: 'Light turret introduction.' } },
  { id: 'shield_carrier_intro', stageId: 'stage_downtown_traffic_collapse', name: 'Shield Carrier Intro', encounterIds: ['enc_downtown_shield_blockade'], category: 'tutorial', difficultyWeight: 2, recommendedCounterplay: ['shield break', 'support shield'], stageSuitability: ['defense'], editorMeta: { notes: 'First shield pressure.' } },
  { id: 'repair_wisp_intro', stageId: 'stage_factory_core_breakdown', name: 'Repair Wisp Intro', encounterIds: ['enc_factory_support_units'], category: 'tutorial', difficultyWeight: 2.5, recommendedCounterplay: ['focus support enemies'], stageSuitability: ['factory'], editorMeta: { notes: 'Support enemy introduction.' } },
  { id: 'spawner_intro', stageId: 'stage_factory_core_breakdown', name: 'Spawner Intro', encounterIds: ['enc_factory_support_units'], category: 'tutorial', difficultyWeight: 3, recommendedCounterplay: ['aoe', 'interrupt summon'], stageSuitability: ['factory'], editorMeta: { notes: 'Spawner enemy introduction.' } },
];
