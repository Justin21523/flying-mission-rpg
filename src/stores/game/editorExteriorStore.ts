import { nanoid } from 'nanoid';
import { createEditorCollection } from './createEditorCollection';
import type { ExteriorPart } from '../../types/game/exterior';
import { SEED_EXTERIOR_PARTS } from '../../data/game/exteriorLayout';

// Editable base-exterior + flight-route layout (reuses the collection factory). Rendered + gizmo-edited
// by ExteriorLayer; navpoints guide the flight.
export const useEditorExteriorStore = createEditorCollection<ExteriorPart>({
  storageKey: 'aero-rescue-editor-exterior-v1',
  seed: SEED_EXTERIOR_PARTS,
  makeId: () => `ext_${nanoid(6)}`,
});

export function getExteriorParts(): ExteriorPart[] {
  return useEditorExteriorStore.getState().items;
}
export function getExteriorByKind(kind: ExteriorPart['kind']): ExteriorPart | undefined {
  return useEditorExteriorStore.getState().items.find((p) => p.kind === kind);
}
export function getNavpoints(): ExteriorPart[] {
  return useEditorExteriorStore
    .getState()
    .items.filter((p) => p.kind === 'navpoint')
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}
