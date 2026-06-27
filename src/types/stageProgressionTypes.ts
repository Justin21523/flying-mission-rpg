export type StageRuntimeStatus =
  | 'inactive'
  | 'briefing'
  | 'team-select'
  | 'travel'
  | 'landing'
  | 'loading-stage'
  | 'playing'
  | 'stage-clear'
  | 'stage-failed'
  | 'returning-to-base'
  | 'completed';

export type StageClearRule =
  | { type: 'all-objectives-complete' }
  | { type: 'complete-objective'; objectiveId: string }
  | { type: 'complete-segment'; segmentId: string }
  | { type: 'complete-encounter'; encounterId: string }
  | { type: 'resolve-incident'; incidentId: string }
  | { type: 'defeat-boss'; bossId: string }
  | { type: 'debug-force-clear' };

export type StageFailRule =
  | { type: 'player-downed' }
  | { type: 'objective-failed'; objectiveId: string }
  | { type: 'incident-failed'; incidentId: string }
  | { type: 'time-limit'; seconds: number };

export type CampaignUnlockRule =
  | { type: 'start-unlocked'; stageId: string }
  | { type: 'clear-stage'; stageId: string; unlockStageIds: string[] }
  | { type: 'debug-unlocked'; stageIds: string[] };

export interface StageScoreState {
  score: number;
  objectivesCompleted: number;
  encountersCleared: number;
  incidentsResolved: number;
  bossesDefeated: number;
  elapsedSeconds: number;
  grade?: 'S' | 'A' | 'B' | 'C';
}

export type StageRuntimeState = {
  activeCampaignId?: string;
  activeStageId?: string;
  activeLevelLayoutId?: string;
  status: StageRuntimeStatus;
  activeSegmentId?: string;
  completedStageIds: string[];
  unlockedStageIds: string[];
  completedObjectiveIds: string[];
  failedObjectiveIds: string[];
  activeEncounterIds: string[];
  completedEncounterIds: string[];
  activeIncidentIds: string[];
  completedIncidentIds: string[];
  activeBossId?: string;
  stageStartedAt?: number;
  stageCompletedAt?: number;
  score: StageScoreState;
  rewardsPending: boolean;
  debug?: {
    unlockAllStages: boolean;
    allowJumpToStage: boolean;
    allowForceClear: boolean;
    godMode: boolean;
  };
};

export interface StageProgressionSnapshot {
  selectedCampaignId?: string;
  lastPlayedStageId?: string;
  completedStageIds: string[];
  unlockedStageIds: string[];
  unlockedCharacterIds: string[];
  unlockedAbilityIds: string[];
  unlockedSupportAbilityIds: string[];
  bestStageScores: Record<string, StageScoreState>;
  stageClearTimestamps: Record<string, string>;
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}
