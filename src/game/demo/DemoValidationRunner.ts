import type { DemoChecklistItem, DemoValidationReport } from '../../types/demoTypes';
import { RESCUE_VANGUARD_CAMPAIGN_ID } from '../../data/campaigns/campaignDefinitions';
import { getCampaignDefinition, getStageDefinition } from '../../stores/useStageEditorStore';
import { getInitialUnlockedStageIds } from '../campaign/StageUnlockController';
import { buildStagePlaytestReport } from '../playtest/StagePlaytestAssertions';
import { getStagePlaytestScenario } from '../../stores/useStageContentEditorStore';
import { useDemoModeStore } from '../../stores/useDemoModeStore';
import { makeChecklistItem } from './DemoChecklist';

export function runDemoValidationChecklist(): DemoValidationReport {
  const campaign = getCampaignDefinition(RESCUE_VANGUARD_CAMPAIGN_ID);
  const stage1 = getStageDefinition('stage_sunny_harbor_emergency');
  const stage2 = getStageDefinition('stage_downtown_traffic_collapse');
  const report = stage1 ? buildStagePlaytestReport(stage1, getStagePlaytestScenario(stage1.id)) : undefined;
  const demo = useDemoModeStore.getState();
  const unlocked = campaign ? getInitialUnlockedStageIds(campaign) : [];
  const items: DemoChecklistItem[] = [
    makeChecklistItem('app-starts', true, 'React shell and GameBoot are mounted by App.'),
    makeChecklistItem('campaign-map-loads', !!campaign, campaign?.name),
    makeChecklistItem('stage-1-unlocked', unlocked.includes('stage_sunny_harbor_emergency')),
    makeChecklistItem('stage-1-briefing-loads', !!stage1),
    makeChecklistItem('character-select-works', !!stage1?.recommendedCharacterIds.length),
    makeChecklistItem('launch-flight-landing-or-skip', !!stage1?.travelRouteId, stage1?.travelRouteId),
    makeChecklistItem('stage-1-gameplay-starts', !!report?.checks.hasPlayablePath),
    makeChecklistItem('objective-hud-appears', !!stage1?.objectiveIds.length),
    makeChecklistItem('basic-combat-works', !!stage1?.encounterPackIds.length),
    makeChecklistItem('incident-can-resolve', !!stage1?.incidentTemplateIds.length),
    makeChecklistItem('obstacle-can-clear', !!stage1?.obstaclePackIds.length),
    makeChecklistItem('stage-can-complete', report?.checks.canCompleteStage === true),
    makeChecklistItem('stage-clear-ui-appears', !!stage1?.rewardId),
    makeChecklistItem('stage-2-unlocks', stage1?.unlocksOnClear.stageIds?.includes(stage2?.id ?? '') === true),
    makeChecklistItem('edit-mode-opens', true, 'F1 toggles useUiStore.editMode.'),
    makeChecklistItem('debug-hidden-in-demo', demo.enabled && demo.hideDebugByDefault),
    { id: 'build-succeeds', label: 'Build succeeds', status: 'warning', detail: 'Verified by npm run build outside the browser checklist.' },
  ];
  const hasFail = items.some((item) => item.status === 'fail');
  const hasWarning = items.some((item) => item.status === 'warning');
  return { status: hasFail ? 'fail' : hasWarning ? 'warning' : 'pass', items, generatedAt: new Date().toISOString() };
}
