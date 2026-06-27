import { beforeEach, describe, expect, it } from 'vitest';
import { seedGameContent } from '../../game/boot/seedGameContent';
import { completeStage, loadCampaign, startStage } from '../../game/campaign/CampaignDirector';
import { RESCUE_VANGUARD_CAMPAIGN_ID } from '../../data/campaigns/campaignDefinitions';
import { getStageDefinition, getStageReward } from '../../stores/useStageEditorStore';
import { getStagePolishPreset } from '../../stores/useStageContentEditorStore';
import { useStageProgressionStore } from '../../stores/game/useStageProgressionStore';

describe('StageClearPolish', () => {
  beforeEach(() => { localStorage.clear(); seedGameContent(); useStageProgressionStore.getState().resetRuntime(); });

  it('has clear copy, reward, and next unlock data', () => {
    loadCampaign(RESCUE_VANGUARD_CAMPAIGN_ID);
    expect(startStage('stage_sunny_harbor_emergency')).toBe(true);
    completeStage('stage_sunny_harbor_emergency');
    const stage = getStageDefinition('stage_sunny_harbor_emergency')!;
    expect(getStagePolishPreset(stage.id)?.clearTitle).toContain('Harbor');
    expect(getStageReward(stage.rewardId)?.name).toBeTruthy();
    expect(stage.unlocksOnClear.stageIds).toContain('stage_downtown_traffic_collapse');
  });
});
