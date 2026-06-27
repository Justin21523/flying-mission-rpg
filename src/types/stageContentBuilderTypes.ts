import type { StageContentPackDefinition } from './stageContentTypes';
import type { StageBalanceProfile } from './stageBalanceTypes';

export type StageContentBuilderDraft = {
  id: string;
  stageId: string;
  themeType: string;
  pacingType: string;
  difficultyRating: 1 | 2 | 3 | 4 | 5;
  suggestedEncounterPackIds: string[];
  suggestedIncidentTemplateIds: string[];
  suggestedObstaclePackIds: string[];
  suggestedBossEncounterId?: string;
  contentPack: StageContentPackDefinition;
  balanceProfile: StageBalanceProfile;
};

export type StageContentBuilderInput = {
  stageId: string;
  themeType: string;
  pacingType: string;
  difficultyRating: 1 | 2 | 3 | 4 | 5;
  duplicateFromStageId?: string;
};
