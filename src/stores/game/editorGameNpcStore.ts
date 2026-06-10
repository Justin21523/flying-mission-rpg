import { nanoid } from 'nanoid';
import { createEditorCollection } from './createEditorCollection';
import type { NPCDefinition } from '../../types/game/npc';
import { SEED_NPCS } from '../../data/game/npcs';

// Named *GameNpc* to avoid colliding with the dormant POLI `editorNpcStore` (different NPC shape).
export const useEditorGameNpcStore = createEditorCollection<NPCDefinition>({
  storageKey: 'aero-rescue-editor-npc-v2',
  seed: SEED_NPCS,
  makeId: () => `npc_${nanoid(6)}`,
});

export function getEditorGameNpcs(): NPCDefinition[] {
  return useEditorGameNpcStore.getState().items;
}
export function getEditorGameNpc(id: string): NPCDefinition | undefined {
  return useEditorGameNpcStore.getState().items.find((n) => n.id === id);
}
