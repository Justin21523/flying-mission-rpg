import { nanoid } from 'nanoid';
import { createEditorCollection } from './game/createEditorCollection';
import type { StageContentPackDefinition } from '../types/stageContentTypes';
import type { StageBalanceProfile } from '../types/stageBalanceTypes';
import type { StagePolishPreset } from '../types/stagePolishTypes';
import type { StagePlaytestScenario } from '../types/stagePlaytestTypes';
import { SEED_STAGE_CONTENT_PACKS } from '../data/stage-content/stageContentPacks';
import { SEED_STAGE_BALANCE_PROFILES } from '../data/stage-content/stageBalanceProfiles';
import { SEED_STAGE_POLISH_PRESETS } from '../data/stage-content/stagePolishPresets';
import { SEED_STAGE_PLAYTEST_SCENARIOS } from '../data/stage-content/stagePlaytestScenarios';

export const useStageContentPackStore = createEditorCollection<StageContentPackDefinition>({
  storageKey: 'aero-rescue-editor-stage-content-packs-v1',
  seed: SEED_STAGE_CONTENT_PACKS,
  makeId: () => `content_${nanoid(6)}`,
});

export const useStageBalanceProfileStore = createEditorCollection<StageBalanceProfile>({
  storageKey: 'aero-rescue-editor-stage-balance-profiles-v1',
  seed: SEED_STAGE_BALANCE_PROFILES,
  makeId: () => `balance_${nanoid(6)}`,
});

export const useStagePolishPresetStore = createEditorCollection<StagePolishPreset>({
  storageKey: 'aero-rescue-editor-stage-polish-presets-v1',
  seed: SEED_STAGE_POLISH_PRESETS,
  makeId: () => `polish_${nanoid(6)}`,
});

export const useStagePlaytestScenarioStore = createEditorCollection<StagePlaytestScenario>({
  storageKey: 'aero-rescue-editor-stage-playtest-scenarios-v1',
  seed: SEED_STAGE_PLAYTEST_SCENARIOS,
  makeId: () => `scenario_${nanoid(6)}`,
});

export function getStageContentPack(stageId: string): StageContentPackDefinition | undefined {
  return useStageContentPackStore.getState().items.find((pack) => pack.stageId === stageId);
}

export function getStageBalanceProfile(stageId: string): StageBalanceProfile | undefined {
  return useStageBalanceProfileStore.getState().items.find((profile) => profile.stageId === stageId);
}

export function getStagePolishPreset(stageId: string): StagePolishPreset | undefined {
  return useStagePolishPresetStore.getState().items.find((preset) => preset.stageId === stageId);
}

export function getStagePlaytestScenario(stageId: string): StagePlaytestScenario | undefined {
  return useStagePlaytestScenarioStore.getState().items.find((scenario) => scenario.stageId === stageId);
}
