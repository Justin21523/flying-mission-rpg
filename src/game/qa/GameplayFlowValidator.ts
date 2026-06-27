import type { QAFinding } from './ReleaseCandidateChecklist';
import { getStageDefinition } from '../../stores/useStageEditorStore';
import { getStagePlaytestScenario } from '../../stores/useStageContentEditorStore';
import { buildStagePlaytestReport } from '../playtest/StagePlaytestAssertions';

export function validateGameplayFlow(stageId = 'stage_sunny_harbor_emergency'): QAFinding[] {
  const stage = getStageDefinition(stageId);
  if (!stage) return [{ id: 'gameplay_stage_missing', severity: 'error', system: 'gameplay-flow', message: `${stageId} is missing.` }];
  const report = buildStagePlaytestReport(stage, getStagePlaytestScenario(stage.id));
  const findings: QAFinding[] = [];
  if (report.validationStatus === 'fail') findings.push({ id: 'gameplay_playtest_failed', severity: 'error', system: 'gameplay-flow', message: `${stage.name} playtest report failed.`, detail: [...report.contentWarnings, ...report.runtimeWarnings].join('; ') });
  for (const [key, value] of Object.entries(report.checks)) {
    if (!value) findings.push({ id: `gameplay_check_${key}`, severity: 'error', system: 'gameplay-flow', message: `${stage.name} failed playtest check ${key}.` });
  }
  return findings;
}
