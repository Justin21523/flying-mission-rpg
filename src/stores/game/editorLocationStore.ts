import { nanoid } from 'nanoid';
import { createEditorCollection } from './createEditorCollection';
import type { WorldLocation } from '../../types/game/world';
import { SEED_LOCATIONS } from '../../data/game/locations';

export const useEditorLocationStore = createEditorCollection<WorldLocation>({
  storageKey: 'aero-rescue-editor-location-v1',
  seed: SEED_LOCATIONS,
  makeId: () => `loc_${nanoid(6)}`,
});

export function getEditorLocations(): WorldLocation[] {
  return useEditorLocationStore.getState().items;
}
export function getEditorLocation(id: string): WorldLocation | undefined {
  return useEditorLocationStore.getState().items.find((l) => l.id === id);
}
