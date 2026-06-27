import type { CampaignDefinition } from '../../types/campaignTypes';
import type { StageProgressionSnapshot } from '../../types/stageProgressionTypes';
import { useGameStore } from '../../stores/game/useGameStore';
import { useStageProgressionStore } from '../../stores/game/useStageProgressionStore';
import { getCampaignDefinition, getStageDefinition } from '../../stores/useStageEditorStore';
import { getInitialUnlockedStageIds, getUnlockedStageIds } from './StageUnlockController';
import { clearCampaignProgression, loadCampaignProgression, saveCampaignProgression } from './CampaignSaveAdapter';
import { ProgressTracker } from '../progress/ProgressTracker';
import { applyStageEconomyReward } from './StageRewardController';
import { rescuedNpcIdsForStage } from './rescueResolver';
import { useEditorGameNpcStore } from '../../stores/game/editorGameNpcStore';
import { useSaveStore } from '../../stores/useSaveStore';

export function loadCampaign(campaignId: string): CampaignDefinition {
  const campaign = getCampaignDefinition(campaignId);
  if (!campaign) throw new Error(`Campaign not found: ${campaignId}`);
  const saved = loadCampaignProgression();
  const initialUnlocked = saved?.unlockedStageIds.length ? saved.unlockedStageIds : getInitialUnlockedStageIds(campaign);
  useStageProgressionStore.getState().setRuntime({
    activeCampaignId: campaign.id,
    completedStageIds: saved?.completedStageIds ?? [],
    unlockedStageIds: initialUnlocked,
  });
  return campaign;
}

export function startCampaign(campaignId: string): CampaignDefinition {
  const campaign = loadCampaign(campaignId);
  useStageProgressionStore.getState().startCampaign(campaign.id, getInitialUnlockedStageIds(campaign));
  startStage(campaign.startStageId);
  return campaign;
}

export function getUnlockedStages(): string[] {
  const state = useStageProgressionStore.getState();
  if (!state.activeCampaignId) return [];
  const campaign = getCampaignDefinition(state.activeCampaignId);
  return campaign ? getUnlockedStageIds(campaign, state) : [];
}

export function startStage(stageId: string): boolean {
  const stage = getStageDefinition(stageId);
  if (!stage) return false;
  useStageProgressionStore.getState().startStageBriefing(stage.id, stage.campaignId, stage.levelLayoutId);
  const game = useGameStore.getState();
  if (game.phase === 'MISSION_CONTROL') game.requestTransition('MISSION_BRIEFING');
  else game.jumpTo('MISSION_BRIEFING');
  return true;
}

export function completeStage(stageId: string): void {
  const stage = getStageDefinition(stageId);
  if (!stage) return;
  const progression = useStageProgressionStore.getState();
  progression.completeActiveStage();
  for (const unlockId of stage.unlocksOnClear.stageIds ?? []) progression.unlockStage(unlockId);
  // Batch L (A1) — persist character unlocks earned on clear into the save (UnlockManager reads this set).
  for (const charId of stage.unlocksOnClear.characterIds ?? []) ProgressTracker.markCharacterUnlocked(charId);
  // Batch L (A3) — grant the stage reward coins to the account wallet.
  applyStageEconomyReward(stage);
  // Batch E — rescue the Hub residents linked to this stage (they appear in the Hangar + offer a side-quest).
  for (const npcId of rescuedNpcIdsForStage(stageId, useEditorGameNpcStore.getState().items)) {
    useSaveStore.getState().addProgressId('rescuedNpcIds', npcId);
  }
  saveCampaignProgression(exportProgressionSnapshot());
}

export function failStage(stageId?: string): void {
  void stageId;
  useStageProgressionStore.getState().failActiveStage();
}

export function unlockStage(stageId: string): void {
  useStageProgressionStore.getState().unlockStage(stageId);
  saveCampaignProgression(exportProgressionSnapshot());
}

export function returnToBase(): void {
  useStageProgressionStore.getState().setStatus('returning-to-base');
  useGameStore.getState().jumpTo('MISSION_CONTROL');
}

export function resetCampaign(): void {
  clearCampaignProgression();
  useStageProgressionStore.getState().resetRuntime();
}

export function exportProgressionSnapshot(): StageProgressionSnapshot {
  const state = useStageProgressionStore.getState();
  const completedStageIds = state.completedStageIds;
  const stageClearTimestamps: Record<string, string> = {};
  for (const stageId of completedStageIds) stageClearTimestamps[stageId] = new Date(state.stageCompletedAt ?? Date.now()).toISOString();
  return {
    selectedCampaignId: state.activeCampaignId,
    lastPlayedStageId: state.activeStageId,
    completedStageIds,
    unlockedStageIds: state.unlockedStageIds,
    unlockedCharacterIds: [],
    unlockedAbilityIds: [],
    unlockedSupportAbilityIds: [],
    bestStageScores: state.activeStageId ? { [state.activeStageId]: state.score } : {},
    stageClearTimestamps,
  };
}
