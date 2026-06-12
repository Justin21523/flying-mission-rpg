import { createEditorCollection } from './createEditorCollection';
import type { TransformationPolishPreset } from '../../types/game/transformationPolish';
import { SEED_TRANSFORMATION_POLISH } from '../../data/game/transformationPolish';

// Batch 12 — authored transformation polish presets (✨ Transform Polish tab). The polish director reads
// the per-character preset from here (falling back to the character's own color when none exists).
export const useEditorTransformationPolishStore = createEditorCollection<TransformationPolishPreset>({
  storageKey: 'aero-rescue-editor-xfpolish-v1',
  seed: SEED_TRANSFORMATION_POLISH,
  makeId: () => `xfpolish_${Date.now().toString(36)}`,
});

export function getEditorTransformationPolishPresets(): TransformationPolishPreset[] {
  return useEditorTransformationPolishStore.getState().items;
}

export function getEditorTransformationPolishForCharacter(characterId: string): TransformationPolishPreset | undefined {
  return useEditorTransformationPolishStore.getState().items.find((p) => p.characterId === characterId);
}
