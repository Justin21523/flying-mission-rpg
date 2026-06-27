import { describe, expect, it, beforeEach } from 'vitest';
import { seedGameContent } from '../../game/boot/seedGameContent';
import { loadCampaign, startStage } from '../../game/campaign/CampaignDirector';
import { RESCUE_VANGUARD_CAMPAIGN_ID } from '../../data/campaigns/campaignDefinitions';
import { useStageProgressionStore } from '../../stores/game/useStageProgressionStore';

describe('CampaignDirector', () => {
  beforeEach(() => { localStorage.clear(); seedGameContent(); useStageProgressionStore.getState().resetRuntime(); });

  it('loads the seed campaign and starts a stage briefing', () => {
    const campaign = loadCampaign(RESCUE_VANGUARD_CAMPAIGN_ID);
    expect(campaign.stageIds).toHaveLength(10);
    expect(startStage('stage_sunny_harbor_emergency')).toBe(true);
    expect(useStageProgressionStore.getState().status).toBe('briefing');
  });
});
