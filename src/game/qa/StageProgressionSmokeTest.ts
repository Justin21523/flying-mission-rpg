import type { QACheck } from './ReleaseCandidateChecklist';
import { makeSmokeCheck } from './SmokeTestRunner';
import { RESCUE_VANGUARD_CAMPAIGN_ID } from '../../data/campaigns/campaignDefinitions';
import { getCampaignDefinition, getCampaignDefinitions, getStageDefinitions, getStageReward, getStagesForCampaign } from '../../stores/useStageEditorStore';
import { validateCampaign, validateStage } from '../campaign/CampaignValidation';
import { getEnvironmentTheme } from '../../stores/useEnvironmentEditorStore';
import { getLevelLayout } from '../../stores/useLevelEditorStore';

export function runStageProgressionSmokeTest(): QACheck[] {
  const campaign = getCampaignDefinition(RESCUE_VANGUARD_CAMPAIGN_ID);
  const stages = campaign ? getStagesForCampaign(campaign.id) : [];
  const campaignIds = getCampaignDefinitions().map((item) => item.id);
  const checks: QACheck[] = [
    makeSmokeCheck('campaign_exists', 'Rescue campaign exists', 'campaign', !!campaign, 'Rescue Vanguard campaign is missing.'),
    makeSmokeCheck('stage_count', 'Campaign has ten stages', 'campaign', stages.length >= 10, `Campaign has ${stages.length} stages.`),
  ];
  if (campaign) {
    const campaignResult = validateCampaign(campaign, getStageDefinitions());
    checks.push(makeSmokeCheck('campaign_validation', 'Campaign validation passes', 'campaign', campaignResult.ok, campaignResult.errors.join('; ')));
  }
  for (const stage of stages) {
    const result = validateStage(stage, campaignIds);
    checks.push(makeSmokeCheck(`stage_valid_${stage.id}`, `${stage.name} validates`, 'stage', result.ok, result.errors.join('; ')));
    checks.push(makeSmokeCheck(`stage_reward_${stage.id}`, `${stage.name} has reward`, 'stage', !!getStageReward(stage.rewardId), `${stage.id} missing reward.`));
    checks.push(makeSmokeCheck(`stage_environment_${stage.id}`, `${stage.name} has environment`, 'stage', !!getEnvironmentTheme(stage.environmentThemeId), `${stage.id} missing environment.`));
    checks.push(makeSmokeCheck(`stage_layout_${stage.id}`, `${stage.name} has level layout`, 'stage', !!getLevelLayout(stage.levelLayoutId), `${stage.id} missing level layout.`));
  }
  const finale = stages.find((stage) => stage.stageIndex === 10);
  checks.push(makeSmokeCheck('stage_10_finale', 'Stage 10 marks finale complete', 'stage', !!finale && !finale.unlocksOnClear.stageIds?.length, 'Stage 10 should be campaign finale without next stage unlock.'));
  return checks;
}
