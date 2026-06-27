import { describe, expect, it, beforeEach } from 'vitest';
import { seedGameContent } from '../../game/boot/seedGameContent';
import { completeStage, loadCampaign, startStage } from '../../game/campaign/CampaignDirector';
import { claimStageReward } from '../../game/campaign/StageRewardController';
import { RESCUE_VANGUARD_CAMPAIGN_ID } from '../../data/campaigns/campaignDefinitions';
import { getStageDefinition } from '../../stores/useStageEditorStore';
import { useStageProgressionStore } from '../../stores/game/useStageProgressionStore';

describe('FullStageClearFlow', () => {
  beforeEach(() => { localStorage.clear(); seedGameContent(); useStageProgressionStore.getState().resetRuntime(); });

  it('runs Stage 1 clear, reward, unlock Stage 2', () => {
    loadCampaign(RESCUE_VANGUARD_CAMPAIGN_ID);
    expect(startStage('stage_sunny_harbor_emergency')).toBe(true);
    completeStage('stage_sunny_harbor_emergency');
    const stage = getStageDefinition('stage_sunny_harbor_emergency')!;
    const reward = claimStageReward(stage);
    expect(reward.unlockedStageIds).toContain('stage_downtown_traffic_collapse');
    expect(useStageProgressionStore.getState().completedStageIds).toContain('stage_sunny_harbor_emergency');
    expect(useStageProgressionStore.getState().unlockedStageIds).toContain('stage_downtown_traffic_collapse');
  });
});
