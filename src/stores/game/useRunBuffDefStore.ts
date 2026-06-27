import { nanoid } from 'nanoid';
import { createEditorCollection } from './createEditorCollection';
import type { RunBuffDefinition } from '../../data/progression/runBuffs';
import { SEED_RUN_BUFFS } from '../../data/progression/runBuffs';

// Batch N — editable roguelite buff pool (⬆ Progression tab). The 3-choice overlay draws from the enabled set.
export const useRunBuffDefStore = createEditorCollection<RunBuffDefinition>({
  storageKey: 'aero-rescue-run-buff-def-v1',
  seed: SEED_RUN_BUFFS,
  makeId: () => `buff_${nanoid(6)}`,
});

export function getRunBuffDefs(): RunBuffDefinition[] {
  return useRunBuffDefStore.getState().items;
}
export function getRunBuffDef(id: string): RunBuffDefinition | undefined {
  return useRunBuffDefStore.getState().items.find((d) => d.id === id);
}
export function getEnabledRunBuffDefs(): RunBuffDefinition[] {
  return useRunBuffDefStore.getState().items.filter((d) => d.enabled !== false);
}
