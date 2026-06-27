import type { CampaignDefinition } from '../../types/campaignTypes';
import type { StageDefinition } from '../../types/stageTypes';
import type { ValidationResult } from '../../types/stageProgressionTypes';
import { getEnvironmentTheme } from '../../stores/useEnvironmentEditorStore';
import { getLevelLayout } from '../../stores/useLevelEditorStore';
import { getStageReward } from '../../stores/useStageEditorStore';
import { getEditorMissionZone } from '../../stores/game/editorMissionZoneStore';

export function validateCampaign(campaign: CampaignDefinition, stages: StageDefinition[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const stageIds = new Set(stages.map((stage) => stage.id));
  if (!campaign.stageIds.length) errors.push(`${campaign.id}: stageIds cannot be empty.`);
  if (!stageIds.has(campaign.startStageId)) errors.push(`${campaign.id}: startStageId does not exist.`);
  for (const id of campaign.stageIds) if (!stageIds.has(id)) errors.push(`${campaign.id}: references missing stage ${id}.`);
  for (const rule of campaign.unlockRules) {
    if (rule.type === 'start-unlocked' && !stageIds.has(rule.stageId)) errors.push(`${campaign.id}: unlock rule references missing stage ${rule.stageId}.`);
    if (rule.type === 'clear-stage') {
      if (!stageIds.has(rule.stageId)) errors.push(`${campaign.id}: clear rule references missing source stage ${rule.stageId}.`);
      for (const id of rule.unlockStageIds) if (!stageIds.has(id)) errors.push(`${campaign.id}: clear rule unlocks missing stage ${id}.`);
    }
  }
  return { ok: errors.length === 0, errors, warnings };
}

export function validateStage(stage: StageDefinition, campaignIds: string[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!stage.id) errors.push('Stage id cannot be empty.');
  if (!campaignIds.includes(stage.campaignId)) errors.push(`${stage.id}: campaignId ${stage.campaignId} does not exist.`);
  if (!getEditorMissionZone(stage.missionZoneId)) errors.push(`${stage.id}: missionZoneId ${stage.missionZoneId} does not exist.`);
  if (!getLevelLayout(stage.levelLayoutId)) errors.push(`${stage.id}: levelLayoutId ${stage.levelLayoutId} does not exist.`);
  if (!getEnvironmentTheme(stage.environmentThemeId)) errors.push(`${stage.id}: environmentThemeId ${stage.environmentThemeId} does not exist.`);
  if (!stage.clearRules.length) errors.push(`${stage.id}: clearRules cannot be empty.`);
  if (stage.rewardId && !getStageReward(stage.rewardId)) errors.push(`${stage.id}: reward ${stage.rewardId} does not exist.`);
  return { ok: errors.length === 0, errors, warnings };
}
