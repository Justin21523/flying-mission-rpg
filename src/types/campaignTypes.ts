import type { CampaignUnlockRule } from './stageProgressionTypes';

export type CampaignDefinition = {
  id: string;
  name: string;
  description?: string;
  startStageId: string;
  stageIds: string[];
  progressionMode: 'linear' | 'branching' | 'hub-select' | 'debug-unlocked';
  unlockRules: CampaignUnlockRule[];
  defaultTeamRules?: {
    minCharacters: number;
    maxCharacters: number;
    minSupportCharacters?: number;
    maxSupportCharacters?: number;
  };
  saveProgression: boolean;
  editorMeta?: {
    notes?: string;
    difficulty?: 'easy' | 'normal' | 'hard';
    tags?: string[];
  };
};
