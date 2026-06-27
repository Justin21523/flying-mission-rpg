import { describe, expect, it, beforeEach } from 'vitest';
import { seedGameContent } from '../../game/boot/seedGameContent';
import { StageProgressionRuntime } from '../../game/campaign/StageProgressionRuntime';
import { RESCUE_VANGUARD_CAMPAIGN_ID } from '../../data/campaigns/campaignDefinitions';
import { useStageProgressionStore } from '../../stores/game/useStageProgressionStore';

describe('StageProgressionRuntime', () => {
  beforeEach(() => { localStorage.clear(); seedGameContent(); useStageProgressionStore.getState().resetRuntime(); });

  it('starts the campaign at stage 1', () => {
    StageProgressionRuntime.startCampaign(RESCUE_VANGUARD_CAMPAIGN_ID);
    expect(useStageProgressionStore.getState().activeStageId).toBe('stage_sunny_harbor_emergency');
  });
});
