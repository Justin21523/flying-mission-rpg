import { nanoid } from 'nanoid';
import { createEditorCollection } from './createEditorCollection';
import type { YokaiType } from '../../types/yokai';
import { SEED_AERO_YOKAI } from '../../data/game/yokaiTypes';

// Aero hunt yokai-type roster (separate from the dormant POLI editorYokaiStore). Hunts spawn from the enabled
// types; authored in the 👹 Yokai/Hunt tab.
export const useEditorAeroYokaiStore = createEditorCollection<YokaiType>({
  storageKey: 'aero-rescue-editor-yokai-v1',
  seed: SEED_AERO_YOKAI,
  makeId: () => `yk_${nanoid(6)}`,
});

export function getEnabledAeroYokaiTypes(): YokaiType[] {
  return useEditorAeroYokaiStore.getState().items.filter((t) => t.enabled);
}
