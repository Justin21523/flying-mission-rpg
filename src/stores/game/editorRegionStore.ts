import { nanoid } from 'nanoid';
import { createEditorCollection } from './createEditorCollection';
import type { Region } from '../../types/game/region';
import { SEED_REGIONS } from '../../data/game/regions';

export const useEditorRegionStore = createEditorCollection<Region>({
  storageKey: 'aero-rescue-editor-region-v1',
  seed: SEED_REGIONS,
  makeId: () => `reg_${nanoid(6)}`,
});

export function getEditorRegions(): Region[] {
  return useEditorRegionStore.getState().items;
}
export function getEditorRegion(id: string | undefined): Region | undefined {
  return id ? useEditorRegionStore.getState().items.find((r) => r.id === id) : undefined;
}
