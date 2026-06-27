import type { EncounterPackDefinition } from '../../types/encounterTypes';

export const ELITE_AND_BOSS_SUPPORT_PACKS: EncounterPackDefinition[] = [
  { id: 'boss_minion_wave_light', stageId: 'stage_skyport_core_finale', name: 'Boss Minion Wave Light', encounterIds: ['enc_skyport_boss_minions'], category: 'boss-support', difficultyWeight: 3, recommendedCounterplay: ['aoe', 'shield support'], stageSuitability: ['boss'], editorMeta: { notes: 'Light boss add wave.' } },
  { id: 'boss_shield_node_wave', stageId: 'stage_skyport_core_finale', name: 'Boss Shield Node Wave', encounterIds: ['enc_skyport_boss_minions'], category: 'boss-support', difficultyWeight: 4, recommendedCounterplay: ['shield break'], stageSuitability: ['boss'], editorMeta: { notes: 'Barrier node support wave.' } },
  { id: 'boss_repair_wisp_wave', stageId: 'stage_rescue_vanguard_finale', name: 'Boss Repair Wisp Wave', encounterIds: ['enc_finale_boss_support'], category: 'boss-support', difficultyWeight: 4.5, recommendedCounterplay: ['focus repair wisp'], stageSuitability: ['finale'], editorMeta: { notes: 'Final boss sustain wave.' } },
  { id: 'boss_zip_glitch_pressure', stageId: 'stage_rescue_vanguard_finale', name: 'Boss Zip Glitch Pressure', encounterIds: ['enc_finale_boss_support'], category: 'boss-support', difficultyWeight: 4.5, recommendedCounterplay: ['slow', 'control field'], stageSuitability: ['finale'], editorMeta: { notes: 'Mobile boss add pressure.' } },
];
