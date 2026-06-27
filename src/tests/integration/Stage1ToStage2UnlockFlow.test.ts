import { beforeEach, describe, expect, it } from 'vitest';
import { seedGameContent } from '../../game/boot/seedGameContent';
import { completeStage, loadCampaign, startStage } from '../../game/campaign/CampaignDirector';
import { RESCUE_VANGUARD_CAMPAIGN_ID } from '../../data/campaigns/campaignDefinitions';
import { useStageProgressionStore } from '../../stores/game/useStageProgressionStore';

describe('Stage1ToStage2UnlockFlow', () => {
  beforeEach(() => { localStorage.clear(); seedGameContent(); useStageProgressionStore.getState().resetRuntime(); });

  it('unlocks Stage 2 after Stage 1 clear', () => {
    loadCampaign(RESCUE_VANGUARD_CAMPAIGN_ID);
    expect(startStage('stage_sunny_harbor_emergency')).toBe(true);
    completeStage('stage_sunny_harbor_emergency');
    expect(useStageProgressionStore.getState().completedStageIds).toContain('stage_sunny_harbor_emergency');
    expect(useStageProgressionStore.getState().unlockedStageIds).toContain('stage_downtown_traffic_collapse');
  });
});
