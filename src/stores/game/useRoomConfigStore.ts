import { createEditorCollection } from './createEditorCollection';
import type { RoomConfigDefinition } from '../../data/progression/roomConfig';
import { SEED_ROOM_CONFIG } from '../../data/progression/roomConfig';

// Wave 3 — editable roguelite room config (single 'room_config' item).
export const useRoomConfigStore = createEditorCollection<RoomConfigDefinition>({
  storageKey: 'aero-rescue-room-config-v1',
  seed: SEED_ROOM_CONFIG,
  makeId: () => 'room_config',
});

export function getRoomConfig(): RoomConfigDefinition {
  return useRoomConfigStore.getState().items.find((c) => c.id === 'room_config') ?? SEED_ROOM_CONFIG[0];
}
