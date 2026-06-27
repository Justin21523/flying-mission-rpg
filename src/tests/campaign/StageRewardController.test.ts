import { describe, expect, it, beforeEach } from 'vitest';
import { seedGameContent } from '../../game/boot/seedGameContent';
import { claimStageReward } from '../../game/campaign/StageRewardController';
import { getStageDefinition } from '../../stores/useStageEditorStore';
import { useStageProgressionStore } from '../../stores/game/useStageProgressionStore';

describe('StageRewardController', () => {
  beforeEach(() => { localStorage.clear(); seedGameContent(); useStageProgressionStore.getState().resetRuntime(); });

  it('claims stage reward and reports unlocks', () => {
    const stage = getStageDefinition('stage_sunny_harbor_emergency')!;
    const result = claimStageReward(stage);
    expect(result.rewardId).toBe('reward_stage_1');
    expect(result.unlockedStageIds).toContain('stage_downtown_traffic_collapse');
  });
});
