import type { StagePlaytestReport, StagePlaytestScenario } from '../../types/stagePlaytestTypes';
import type { StageDefinition } from '../../types/stageTypes';
import { analyzeStageBalance } from '../balancing/StageBalanceAnalyzer';
import { estimateStageDifficulty } from '../balancing/StageDifficultyEstimator';
import { getLevelLayout } from '../../stores/useLevelEditorStore';
import { getEnvironmentTheme } from '../../stores/useEnvironmentEditorStore';
import { getStageContentPack } from '../../stores/useStageContentEditorStore';

export function buildStagePlaytestReport(stage: StageDefinition, scenario?: StagePlaytestScenario): StagePlaytestReport {
  const layout = getLevelLayout(stage.levelLayoutId);
  const environment = getEnvironmentTheme(stage.environmentThemeId);
  const content = getStageContentPack(stage.id);
  const balance = analyzeStageBalance(stage);
  const fatal = balance.filter((finding) => finding.severity === 'fatal').map((finding) => finding.message);
  const warnings = balance.filter((finding) => finding.severity === 'warning').map((finding) => finding.message);
  const checks = {
    hasStartSegment: !!layout?.startSegmentId,
    hasFinalClearCondition: stage.clearRules.length > 0,
    hasPlayablePath: !!layout && layout.segmentIds.includes(layout.startSegmentId) && layout.finalSegmentIds.every((id) => layout.segmentIds.includes(id)),
    hasEnemyEncounter: stage.encounterPackIds.length > 0,
    hasIncidentOrObjective: stage.incidentTemplateIds.length > 0 || stage.objectiveIds.length > 0,
    hasEnvironmentTheme: !!environment,
    hasReward: !!stage.rewardId,
    hasEditModeCoverage: !!content,
    canReachFinalSegment: !!layout && layout.finalSegmentIds.length > 0,
    canCompleteStage: !!scenario && scenario.steps.some((step) => step.type === 'complete-stage'),
  };
  const allChecksPass = Object.values(checks).every(Boolean);
  return {
    stageId: stage.id,
    validationStatus: fatal.length > 0 || !allChecksPass ? 'fail' : warnings.length > 0 ? 'warning' : 'pass',
    checks,
    balanceWarnings: warnings,
    contentWarnings: fatal,
    runtimeWarnings: [],
    estimatedDifficulty: estimateStageDifficulty(stage),
    estimatedDurationMinutes: content?.pacing.expectedDurationMinutes ?? stage.editorMeta?.targetDurationMinutes ?? 10,
  };
}
