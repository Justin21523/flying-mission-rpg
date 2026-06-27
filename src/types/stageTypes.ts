import type { StageClearRule, StageFailRule } from './stageProgressionTypes';

export type StageType = 'rescue' | 'combat' | 'incident' | 'mixed' | 'boss' | 'tutorial' | 'finale';

export interface StageBriefingDefinition {
  title: string;
  summary: string;
  objectives: string[];
  threatSummary?: string;
  environmentSummary?: string;
}

export type StageDefinition = {
  id: string;
  campaignId: string;
  name: string;
  subtitle?: string;
  description: string;
  stageIndex: number;
  stageType: StageType;
  locationId: string;
  travelRouteId?: string;
  environmentThemeId: string;
  missionZoneId: string;
  levelLayoutId: string;
  briefing: StageBriefingDefinition;
  recommendedCharacterIds: string[];
  recommendedSupportIds?: string[];
  requiredSystems: {
    combat: boolean;
    incidents: boolean;
    support: boolean;
    boss: boolean;
    flightApproach: boolean;
  };
  objectiveIds: string[];
  encounterPackIds: string[];
  incidentTemplateIds: string[];
  obstaclePackIds: string[];
  bossEncounterId?: string;
  rewardId?: string;
  unlocksOnClear: {
    stageIds?: string[];
    characterIds?: string[];
    abilityIds?: string[];
    supportAbilityIds?: string[];
    environmentThemeIds?: string[];
  };
  failRules: StageFailRule[];
  clearRules: StageClearRule[];
  editorMeta?: {
    notes?: string;
    targetDurationMinutes?: number;
    difficultyRating?: 1 | 2 | 3 | 4 | 5;
    tags?: string[];
  };
};
