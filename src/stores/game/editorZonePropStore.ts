import { nanoid } from 'nanoid';
import { createEditorCollection } from './createEditorCollection';
import type { ZonePropDefinition } from '../../types/game/zoneProp';
import { SEED_ZONE_PROPS } from '../../data/game/zoneProps';

// World-build Wave 2 — editable decorative zone props (🌳 Zone Props tab). New ids → mergeMissingFromSeed.
export const useEditorZonePropStore = createEditorCollection<ZonePropDefinition>({
  storageKey: 'aero-rescue-editor-zoneprop-v1',
  seed: SEED_ZONE_PROPS,
  makeId: () => `zprop_${nanoid(6)}`,
});

export function getZoneProps(): ZonePropDefinition[] {
  return useEditorZonePropStore.getState().items;
}
