import { nanoid } from 'nanoid';
import { createEditorCollection } from './game/createEditorCollection';
import type { AmbientVfxPresetDefinition, EnvironmentHazardPresetDefinition, EnvironmentPropSetDefinition, EnvironmentThemeDefinition } from '../types/environmentThemeTypes';
import { SEED_AMBIENT_VFX_PRESETS } from '../data/environments/ambientVfxPresets';
import { SEED_ENVIRONMENT_HAZARD_PRESETS } from '../data/environments/environmentHazardPresets';
import { SEED_ENVIRONMENT_PROP_SETS } from '../data/environments/environmentPropSets';
import { SEED_ENVIRONMENT_THEMES } from '../data/environments/environmentThemes';

export const useEnvironmentThemeStore = createEditorCollection<EnvironmentThemeDefinition>({
  storageKey: 'aero-rescue-editor-environment-themes-v1',
  seed: SEED_ENVIRONMENT_THEMES,
  makeId: () => `env_${nanoid(6)}`,
});

export const useEnvironmentPropSetStore = createEditorCollection<EnvironmentPropSetDefinition>({
  storageKey: 'aero-rescue-editor-environment-props-v1',
  seed: SEED_ENVIRONMENT_PROP_SETS,
  makeId: () => `props_${nanoid(6)}`,
});

export const useEnvironmentHazardPresetStore = createEditorCollection<EnvironmentHazardPresetDefinition>({
  storageKey: 'aero-rescue-editor-environment-hazards-v1',
  seed: SEED_ENVIRONMENT_HAZARD_PRESETS,
  makeId: () => `hazard_${nanoid(6)}`,
});

export const useAmbientVfxPresetStore = createEditorCollection<AmbientVfxPresetDefinition>({
  storageKey: 'aero-rescue-editor-ambient-vfx-v1',
  seed: SEED_AMBIENT_VFX_PRESETS,
  makeId: () => `ambient_${nanoid(6)}`,
});

export function getEnvironmentTheme(id: string): EnvironmentThemeDefinition | undefined {
  return useEnvironmentThemeStore.getState().items.find((theme) => theme.id === id);
}
