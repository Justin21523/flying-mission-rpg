import type { CampaignDefinition } from '../../types/campaignTypes';
import { RESCUE_VANGUARD_UNLOCK_RULES } from './stageUnlockRules';

export const RESCUE_VANGUARD_CAMPAIGN_ID = 'campaign_rescue_vanguard';

export const SEED_CAMPAIGNS: CampaignDefinition[] = [
  {
    id: RESCUE_VANGUARD_CAMPAIGN_ID,
    name: 'Rescue Vanguard Campaign',
    description: 'A ten-stage vertical-slice campaign that ties flight, transformation, advanced zones, combat, incidents, support, elites and bosses into one playable loop.',
    startStageId: 'stage_sunny_harbor_emergency',
    stageIds: [
      'stage_sunny_harbor_emergency',
      'stage_downtown_traffic_collapse',
      'stage_factory_core_breakdown',
      'stage_mountain_tunnel_rescue',
      'stage_skyport_core_finale',
      'stage_night_city_blackout',
      'stage_storm_coast_flood_rescue',
      'stage_metro_rescue_labyrinth',
      'stage_aero_tower_high_rescue',
      'stage_rescue_vanguard_finale',
    ],
    progressionMode: 'branching',
    unlockRules: RESCUE_VANGUARD_UNLOCK_RULES,
    defaultTeamRules: { minCharacters: 1, maxCharacters: 1, minSupportCharacters: 0, maxSupportCharacters: 3 },
    saveProgression: true,
    editorMeta: { difficulty: 'normal', tags: ['seed', 'campaign', 'batch-h', 'batch-i', 'vertical-slice'] },
  },
];
