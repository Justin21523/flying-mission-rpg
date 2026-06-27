import { describe, expect, it } from 'vitest';
import { SEED_CAMPAIGNS } from '../../data/campaigns/campaignDefinitions';
import { getUnlockedStageIds } from '../../game/campaign/StageUnlockController';
import { DEFAULT_STAGE_RUNTIME_STATE } from '../../stores/game/useStageProgressionStore';

describe('StageUnlockController', () => {
  it('unlocks the next stage after a clear', () => {
    const campaign = SEED_CAMPAIGNS[0];
    const unlocked = getUnlockedStageIds(campaign, { ...DEFAULT_STAGE_RUNTIME_STATE, completedStageIds: ['stage_sunny_harbor_emergency'], unlockedStageIds: ['stage_sunny_harbor_emergency'] });
    expect(unlocked).toContain('stage_downtown_traffic_collapse');
  });
});
