import type { StageType } from './stageTypes';

export type StagePacingBeatType =
  | 'intro'
  | 'movement'
  | 'incident'
  | 'combat'
  | 'obstacle'
  | 'support-tutorial'
  | 'elite'
  | 'boss'
  | 'rest'
  | 'final-objective'
  | 'extraction';

export type StagePrimarySystem =
  | 'combat'
  | 'incident'
  | 'support'
  | 'boss'
  | 'obstacle'
  | 'navigation'
  | 'repair'
  | 'scan'
  | 'defense';

export type StagePacingBeat = {
  id: string;
  segmentId: string;
  beatType: StagePacingBeatType;
  purpose: string;
  primarySystem: StagePrimarySystem;
  targetIntensity: 1 | 2 | 3 | 4 | 5;
  expectedDurationSeconds: number;
};

export type StagePacingDefinition = {
  expectedDurationMinutes: number;
  pacingType: 'tutorial' | 'steady' | 'escalating' | 'combat-heavy' | 'incident-heavy' | 'boss-focused' | 'mixed';
  beats: StagePacingBeat[];
  restPoints: { segmentId: string; type: 'supply' | 'safe-zone' | 'brief-dialogue' | 'support-beacon' }[];
  intensityCurve: { segmentId: string; intensity: 1 | 2 | 3 | 4 | 5 }[];
};

export type StageContentPackDefinition = {
  id: string;
  stageId: string;
  name: string;
  description?: string;
  environmentThemeId: string;
  levelLayoutId: string;
  encounterPackIds: string[];
  incidentTemplateIds: string[];
  obstaclePackIds: string[];
  bossEncounterId?: string;
  eliteEncounterIds?: string[];
  recommendedCharacterIds: string[];
  recommendedSupportAbilityTypes: string[];
  requiredGameplaySystems: {
    combat: boolean;
    incident: boolean;
    support: boolean;
    boss: boolean;
    repair: boolean;
    scan: boolean;
    defense: boolean;
    heavyBreak: boolean;
  };
  pacing: StagePacingDefinition;
  balanceProfileId: string;
  editorMeta?: {
    notes?: string;
    contentStatus: 'draft' | 'playable' | 'polished';
    stageType?: StageType;
  };
};
