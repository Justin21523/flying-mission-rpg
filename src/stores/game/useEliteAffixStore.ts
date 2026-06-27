import { nanoid } from 'nanoid';
import { createEditorCollection } from './createEditorCollection';
import type { EliteAffixDefinition, AffixId } from '../../data/combat/eliteAffixes';
import { SEED_ELITE_AFFIXES } from '../../data/combat/eliteAffixes';

// Wave 1 — editable elite-affix definitions (🧟 Enemy Wave tab). Read by EliteAffixRuntime at spawn.
export const useEliteAffixStore = createEditorCollection<EliteAffixDefinition>({
  storageKey: 'aero-rescue-elite-affixes-v1',
  seed: SEED_ELITE_AFFIXES,
  makeId: () => `affix_${nanoid(6)}`,
});

export function getAffixDef(id: AffixId): EliteAffixDefinition | undefined {
  return useEliteAffixStore.getState().items.find((a) => a.id === id);
}

export function enabledAffixIds(): AffixId[] {
  return useEliteAffixStore.getState().items.filter((a) => a.enabled !== false).map((a) => a.id);
}
