import { createEditorCollection } from './createEditorCollection';
import type { QualityPreset } from '../../types/game/quality';
import { QUALITY_PRESETS } from '../../data/configuration/qualityPresets';

// Batch 12 — authored quality presets (⚙ Quality tab). The low/medium/high/ultra seed presets are
// editable so a designer can re-tune effect/AI budgets. The QualityPresetController reads the effective
// preset for the selected tier from here (falling back to the seed when absent/invalid). 'custom' is not
// stored here — it is the custom-base + graphicsSettingsStore.customPreset patch.
const SEED_QUALITY_PRESETS: QualityPreset[] = [
  QUALITY_PRESETS.low,
  QUALITY_PRESETS.medium,
  QUALITY_PRESETS.high,
  QUALITY_PRESETS.ultra,
];

export const useEditorQualityStore = createEditorCollection<QualityPreset>({
  storageKey: 'aero-rescue-editor-quality-v1',
  seed: SEED_QUALITY_PRESETS,
  makeId: () => `quality_${Date.now().toString(36)}`,
});

export function getEditorQualityPresets(): QualityPreset[] {
  return useEditorQualityStore.getState().items;
}

export function getEditorQualityPreset(id: string): QualityPreset | undefined {
  return useEditorQualityStore.getState().items.find((p) => p.id === id);
}
