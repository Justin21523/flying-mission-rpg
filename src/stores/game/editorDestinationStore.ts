import { nanoid } from 'nanoid';
import { createEditorCollection } from './createEditorCollection';
import type { DestinationPart } from '../../types/game/destination';
import { SEED_DESTINATION_PARTS } from '../../data/game/destinationLayout';

// Editable destination layout (🏙 Destination tab; gizmo-draggable parts).
export const useEditorDestinationStore = createEditorCollection<DestinationPart>({
  storageKey: 'aero-rescue-editor-destination-v1',
  seed: SEED_DESTINATION_PARTS,
  makeId: () => `dst_${nanoid(6)}`,
});

export function getDestinationParts(): DestinationPart[] {
  return useEditorDestinationStore.getState().items;
}
export function getDestinationPart(id: string): DestinationPart | undefined {
  return useEditorDestinationStore.getState().items.find((p) => p.id === id);
}
export function getDestinationByKind(kind: DestinationPart['kind']): DestinationPart | undefined {
  return useEditorDestinationStore.getState().items.find((p) => p.kind === kind && p.enabled);
}
