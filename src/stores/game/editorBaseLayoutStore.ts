import { nanoid } from 'nanoid';
import { createEditorCollection } from './createEditorCollection';
import type { BasePart } from '../../types/game/base';
import { SEED_BASE_PARTS } from '../../data/game/baseLayout';

// Editable home-base layout (reuses the Batch-1 collection factory — localStorage + import/reset +
// mergeMissingFromSeed). Rendered + gizmo-edited by BaseLayoutLayer.
export const useEditorBaseLayoutStore = createEditorCollection<BasePart>({
  storageKey: 'aero-rescue-editor-base-v1',
  seed: SEED_BASE_PARTS,
  makeId: () => `base_${nanoid(6)}`,
});

export function getBaseParts(): BasePart[] {
  return useEditorBaseLayoutStore.getState().items;
}
export function getBasePartByKind(kind: BasePart['kind']): BasePart | undefined {
  return useEditorBaseLayoutStore.getState().items.find((p) => p.kind === kind);
}
