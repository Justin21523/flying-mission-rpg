import type { CampaignDefinition } from '../../types/campaignTypes';
import type { StageRuntimeState } from '../../types/stageProgressionTypes';

export function getInitialUnlockedStageIds(campaign: CampaignDefinition): string[] {
  const startRules = campaign.unlockRules.filter((rule) => rule.type === 'start-unlocked');
  const unlocked = startRules.map((rule) => rule.stageId);
  return unlocked.length ? Array.from(new Set(unlocked)) : [campaign.startStageId];
}

export function getUnlockedStageIds(campaign: CampaignDefinition, state: Pick<StageRuntimeState, 'completedStageIds' | 'unlockedStageIds' | 'debug'>): string[] {
  if (campaign.progressionMode === 'debug-unlocked' || state.debug?.unlockAllStages) return campaign.stageIds;
  const unlocked = new Set([...state.unlockedStageIds, ...getInitialUnlockedStageIds(campaign)]);
  for (const rule of campaign.unlockRules) {
    if (rule.type === 'clear-stage' && state.completedStageIds.includes(rule.stageId)) {
      for (const stageId of rule.unlockStageIds) unlocked.add(stageId);
    }
    if (rule.type === 'debug-unlocked' && state.debug?.unlockAllStages) {
      for (const stageId of rule.stageIds) unlocked.add(stageId);
    }
  }
  return campaign.stageIds.filter((stageId) => unlocked.has(stageId));
}
