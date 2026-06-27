import type { StageRuntimeState } from './stageProgressionTypes';

export interface StageEditorSelection {
  selectedCampaignId?: string;
  selectedStageId?: string;
  selectedLevelLayoutId?: string;
  selectedEnvironmentThemeId?: string;
  selectedEncounterPackId?: string;
}

export interface StagePlaytestSnapshot {
  exportedAt: string;
  selection: StageEditorSelection;
  runtime: StageRuntimeState;
}
