import { nanoid } from 'nanoid';
import { createEditorCollection } from './game/createEditorCollection';
import type { CampaignDefinition } from '../types/campaignTypes';
import type { StageDefinition } from '../types/stageTypes';
import type { StageRewardDefinition } from '../types/stageRewardTypes';
import { SEED_CAMPAIGNS } from '../data/campaigns/campaignDefinitions';
import { SEED_STAGES } from '../data/campaigns/stageDefinitions';
import { SEED_STAGE_REWARDS } from '../data/campaigns/stageRewards';

export const useCampaignDefinitionStore = createEditorCollection<CampaignDefinition>({
  storageKey: 'aero-rescue-editor-campaigns-v1',
  seed: SEED_CAMPAIGNS,
  makeId: () => `campaign_${nanoid(6)}`,
  // World-build W1 — bump so reconcileFromSeed refreshes the branching unlockRules on existing saves.
  seedVersion: 'worldbuild-w1',
});

export const useStageDefinitionStore = createEditorCollection<StageDefinition>({
  storageKey: 'aero-rescue-editor-stages-v1',
  seed: SEED_STAGES,
  makeId: () => `stage_${nanoid(6)}`,
  // World-build W1 — bump so reconcileFromSeed refreshes the new fork unlocksOnClear on existing saves.
  seedVersion: 'worldbuild-w1',
});

export const useStageRewardStore = createEditorCollection<StageRewardDefinition>({
  storageKey: 'aero-rescue-editor-stage-rewards-v1',
  seed: SEED_STAGE_REWARDS,
  makeId: () => `reward_${nanoid(6)}`,
});

export function getCampaignDefinitions(): CampaignDefinition[] {
  return useCampaignDefinitionStore.getState().items;
}

export function getCampaignDefinition(id: string): CampaignDefinition | undefined {
  return getCampaignDefinitions().find((campaign) => campaign.id === id);
}

export function getStageDefinitions(): StageDefinition[] {
  return useStageDefinitionStore.getState().items;
}

export function getStageDefinition(id: string): StageDefinition | undefined {
  return getStageDefinitions().find((stage) => stage.id === id);
}

export function getStagesForCampaign(campaignId: string): StageDefinition[] {
  return getStageDefinitions()
    .filter((stage) => stage.campaignId === campaignId)
    .sort((a, b) => a.stageIndex - b.stageIndex);
}

export function getStageReward(id: string | undefined): StageRewardDefinition | undefined {
  if (!id) return undefined;
  return useStageRewardStore.getState().items.find((reward) => reward.id === id);
}
