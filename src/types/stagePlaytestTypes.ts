export type StagePlaytestReport = {
  stageId: string;
  validationStatus: 'pass' | 'warning' | 'fail';
  checks: {
    hasStartSegment: boolean;
    hasFinalClearCondition: boolean;
    hasPlayablePath: boolean;
    hasEnemyEncounter: boolean;
    hasIncidentOrObjective: boolean;
    hasEnvironmentTheme: boolean;
    hasReward: boolean;
    hasEditModeCoverage: boolean;
    canReachFinalSegment: boolean;
    canCompleteStage: boolean;
  };
  balanceWarnings: string[];
  contentWarnings: string[];
  runtimeWarnings: string[];
  estimatedDifficulty: 1 | 2 | 3 | 4 | 5;
  estimatedDurationMinutes: number;
};

export type StagePlaytestScenarioStep =
  | { type: 'start-stage'; stageId: string }
  | { type: 'complete-objective'; objectiveId: string }
  | { type: 'spawn-encounter'; encounterId: string }
  | { type: 'clear-encounter'; encounterId: string }
  | { type: 'complete-incident'; incidentId: string }
  | { type: 'jump-segment'; segmentId: string }
  | { type: 'complete-stage'; stageId: string };

export type StagePlaytestScenario = {
  id: string;
  stageId: string;
  name: string;
  steps: StagePlaytestScenarioStep[];
  editorMeta?: { notes?: string };
};
