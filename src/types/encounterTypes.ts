export type EncounterClearCondition =
  | { type: 'all-spawn-groups-cleared' }
  | { type: 'all-enemies-defeated' }
  | { type: 'enemy-group-cleared'; enemySpawnGroupId: string }
  | { type: 'survive-seconds'; seconds: number }
  | { type: 'debug-clear' };

export type EnemyEncounterDefinition = {
  id: string;
  stageId: string;
  segmentId: string;
  encounterType:
    | 'patrol'
    | 'ambush'
    | 'defense-wave'
    | 'arena-wave'
    | 'elite'
    | 'boss-minion-wave'
    | 'environment-threat';
  enemySpawnGroupIds: string[];
  trigger:
    | { type: 'on-segment-enter' }
    | { type: 'on-player-reach-marker'; markerId: string }
    | { type: 'on-incident-step'; incidentId: string; stepId: string }
    | { type: 'on-object-interact'; objectId: string }
    | { type: 'timer'; seconds: number }
    | { type: 'debug-only' };
  clearConditions: EncounterClearCondition[];
  scaling?: {
    enabled: boolean;
    hpMultiplier?: number;
    damageMultiplier?: number;
    countMultiplier?: number;
    basedOnStageDifficulty?: boolean;
  };
  rewardOnClear?: {
    score?: number;
    energy?: number;
    repairParts?: number;
    unlockMarkerId?: string;
  };
  editorMeta?: {
    notes?: string;
    difficultyWeight?: number;
  };
};

export interface EncounterPackDefinition {
  id: string;
  name: string;
  stageId: string;
  encounterIds: string[];
  category?: 'tutorial' | 'standard' | 'advanced' | 'boss-support' | 'stage';
  difficultyWeight?: number;
  recommendedCounterplay?: string[];
  stageSuitability?: string[];
  editorMeta?: { notes?: string };
}
