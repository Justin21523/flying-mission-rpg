export type StageRewardDefinition = {
  id: string;
  name: string;
  description?: string;
  score?: number;
  coins?: number;
  characterIds?: string[];
  abilityIds?: string[];
  supportAbilityIds?: string[];
  unlockStageIds?: string[];
  editorMeta?: {
    notes?: string;
  };
};

export interface StageRewardClaimResult {
  rewardId?: string;
  unlockedStageIds: string[];
  unlockedCharacterIds: string[];
  unlockedAbilityIds: string[];
  unlockedSupportAbilityIds: string[];
}
