import { nanoid } from 'nanoid';
import { createEditorCollection } from './createEditorCollection';
import type { TransformationDefinition } from '../../types/game/transformation';
import { SEED_TRANSFORMATIONS } from '../../data/game/transformations';

export const useEditorTransformationStore = createEditorCollection<TransformationDefinition>({
  storageKey: 'aero-rescue-editor-transformation-v1',
  seed: SEED_TRANSFORMATIONS,
  makeId: () => `xf_${nanoid(6)}`,
});

export function getEditorTransformations(): TransformationDefinition[] {
  return useEditorTransformationStore.getState().items;
}
export function getEditorTransformation(id: string): TransformationDefinition | undefined {
  return useEditorTransformationStore.getState().items.find((t) => t.id === id);
}
