import { beforeEach, describe, expect, it } from 'vitest';
import { seedGameContent } from '../../game/boot/seedGameContent';
import { RESCUE_VANGUARD_CAMPAIGN_ID } from '../../data/campaigns/campaignDefinitions';
import { getCampaignDefinition, getStageDefinition } from '../../stores/useStageEditorStore';
import { getInitialUnlockedStageIds } from '../../game/campaign/StageUnlockController';

describe('StageSelectPolish', () => {
  beforeEach(() => { localStorage.clear(); seedGameContent(); });

  it('has stage cards worth of locked, unlocked, and demo recommended data', () => {
    const campaign = getCampaignDefinition(RESCUE_VANGUARD_CAMPAIGN_ID)!;
    const unlocked = getInitialUnlockedStageIds(campaign);
    const stage1 = getStageDefinition('stage_sunny_harbor_emergency')!;
    const stage2 = getStageDefinition('stage_downtown_traffic_collapse')!;
    expect(stage1.name).toBe('Sunny Harbor Emergency');
    expect(unlocked).toContain(stage1.id);
    expect(unlocked).not.toContain(stage2.id);
    expect(stage1.briefing.threatSummary).toBeTruthy();
    expect(stage1.rewardId).toBeTruthy();
  });
});
