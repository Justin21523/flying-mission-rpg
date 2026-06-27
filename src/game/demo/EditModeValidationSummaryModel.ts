import { getCampaignDefinitions, getStageDefinitions } from '../../stores/useStageEditorStore';
import { getStageContentPack, getStagePlaytestScenario } from '../../stores/useStageContentEditorStore';
import { runDemoValidationChecklist } from './DemoValidationRunner';

export type EditModeValidationEntry = {
  label: string;
  status: 'pass' | 'warning' | 'fail';
  detail: string;
};

export function buildEditModeValidationSummary(): EditModeValidationEntry[] {
  const campaigns = getCampaignDefinitions();
  const stages = getStageDefinitions();
  const missingContent = stages.filter((stage) => !getStageContentPack(stage.id)).length;
  const missingScenario = stages.filter((stage) => !getStagePlaytestScenario(stage.id)).length;
  const demo = runDemoValidationChecklist();
  return [
    { label: 'Campaigns', status: campaigns.length > 0 ? 'pass' : 'fail', detail: `${campaigns.length} campaign definitions` },
    { label: 'Stages', status: stages.length >= 10 ? 'pass' : stages.length >= 8 ? 'warning' : 'fail', detail: `${stages.length} playable stages` },
    { label: 'Content packs', status: missingContent === 0 ? 'pass' : 'warning', detail: missingContent === 0 ? 'All stages covered' : `${missingContent} stages missing content pack` },
    { label: 'Playtest scenarios', status: missingScenario === 0 ? 'pass' : 'warning', detail: missingScenario === 0 ? 'All stages covered' : `${missingScenario} stages missing scenario` },
    { label: 'Demo checklist', status: demo.status, detail: `${demo.items.filter((item) => item.status === 'pass').length}/${demo.items.length} checks passing` },
  ];
}
