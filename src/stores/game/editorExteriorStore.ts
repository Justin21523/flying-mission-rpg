import { nanoid } from 'nanoid';
import { createEditorCollection } from './createEditorCollection';
import type { ExteriorPart } from '../../types/game/exterior';
import { SEED_EXTERIOR_PARTS } from '../../data/game/exteriorLayout';

// Editable base-exterior + flight-route layout (reuses the collection factory). Rendered + gizmo-edited
// by ExteriorLayer; navpoints guide the flight.
// v3: the base is re-seeded GROUND-STANDING (plaza at y=0, station feet on the ground, clouds lifted into a
// high sky layer). Bumping the key replaces the old saved layout that left the base floating in the clouds.
export const useEditorExteriorStore = createEditorCollection<ExteriorPart>({
  storageKey: 'aero-rescue-editor-exterior-v3',
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
