import type { StageDefinition } from '../../types/stageTypes';
import type { StageRewardClaimResult } from '../../types/stageRewardTypes';
import { getStageReward } from '../../stores/useStageEditorStore';
import { useStageProgressionStore } from '../../stores/game/useStageProgressionStore';
import { useWalletStore } from '../../stores/walletStore';

export function previewStageReward(stage: StageDefinition) {
  return getStageReward(stage.rewardId);
}

// Batch L — apply the stage reward's coins to the account wallet (idempotency is the caller's concern: this
// runs once per clear in CampaignDirector.completeStage). Returns the coins granted.
export function applyStageEconomyReward(stage: StageDefinition): number {
  const reward = previewStageReward(stage);
  const coins = reward?.coins ?? 0;
  if (coins > 0) useWalletStore.getState().addCoins(coins);
  return coins;
}

export function claimStageReward(stage: StageDefinition): StageRewardClaimResult {
  const reward = previewStageReward(stage);
  useStageProgressionStore.getState().claimRewards();
  return {
    rewardId: reward?.id,
    unlockedStageIds: stage.unlocksOnClear.stageIds ?? [],
    unlockedCharacterIds: stage.unlocksOnClear.characterIds ?? [],
    unlockedAbilityIds: stage.unlocksOnClear.abilityIds ?? [],
    unlockedSupportAbilityIds: stage.unlocksOnClear.supportAbilityIds ?? [],
  };
}
