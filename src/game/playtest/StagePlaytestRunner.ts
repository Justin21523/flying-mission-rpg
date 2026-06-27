import type { StagePlaytestReport, StagePlaytestScenario } from '../../types/stagePlaytestTypes';
import { startStage as startCampaignStage, completeStage as completeCampaignStage } from '../campaign/CampaignDirector';
import { getStageDefinition } from '../../stores/useStageEditorStore';
import { useStageProgressionStore } from '../../stores/game/useStageProgressionStore';
import { buildStagePlaytestReport } from './StagePlaytestAssertions';

export function runStagePlaytestScenario(scenario: StagePlaytestScenario): StagePlaytestReport {
  const stage = getStageDefinition(scenario.stageId);
  if (!stage) {
    return {
      stageId: scenario.stageId,
      validationStatus: 'fail',
      checks: {
        hasStartSegment: false,
        hasFinalClearCondition: false,
        hasPlayablePath: false,
        hasEnemyEncounter: false,
        hasIncidentOrObjective: false,
        hasEnvironmentTheme: false,
        hasReward: false,
        hasEditModeCoverage: false,
        canReachFinalSegment: false,
        canCompleteStage: false,
      },
      balanceWarnings: [],
      contentWarnings: ['Missing stage definition.'],
      runtimeWarnings: [],
      estimatedDifficulty: 1,
      estimatedDurationMinutes: 0,
    };
  }
  for (const step of scenario.steps) {
    if (step.type === 'start-stage') startCampaignStage(step.stageId);
    if (step.type === 'jump-segment') useStageProgressionStore.getState().setActiveSegment(step.segmentId);
    if (step.type === 'complete-objective') useStageProgressionStore.getState().completeObjective(step.objectiveId);
    if (step.type === 'spawn-encounter') useStageProgressionStore.getState().activateEncounter(step.encounterId);
    if (step.type === 'clear-encounter') useStageProgressionStore.getState().completeEncounter(step.encounterId);
    if (step.type === 'complete-incident') useStageProgressionStore.getState().completeIncident(step.incidentId);
    if (step.type === 'complete-stage') completeCampaignStage(step.stageId);
  }
  return buildStagePlaytestReport(stage, scenario);
}
