import { beforeEach, describe, expect, it } from 'vitest';
import { seedGameContent } from '../../game/boot/seedGameContent';
import { RESCUE_VANGUARD_CAMPAIGN_ID } from '../../data/campaigns/campaignDefinitions';
import { getCampaignDefinition, getStagesForCampaign } from '../../stores/useStageEditorStore';

describe('ExpandedCampaignStages', () => {
  beforeEach(() => { localStorage.clear(); seedGameContent(); });

  it('ships a ten-stage Rescue Vanguard campaign', () => {
    const campaign = getCampaignDefinition(RESCUE_VANGUARD_CAMPAIGN_ID)!;
    const stages = getStagesForCampaign(campaign.id);
    expect(campaign.stageIds.length).toBeGreaterThanOrEqual(10);
    expect(stages.map((stage) => stage.name)).toEqual([
      'Sunny Harbor Emergency',
      'Downtown Traffic Collapse',
      'Factory Core Breakdown',
      'Mountain Tunnel Rescue',
      'Skyport Core Finale',
      'Night City Blackout',
      'Storm Coast Flood Rescue',
      'Metro Rescue Labyrinth',
      'Aero Tower High Rescue',
      'Rescue Vanguard Finale',
    ]);
  });
});
