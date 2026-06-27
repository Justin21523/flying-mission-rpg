import { nanoid } from 'nanoid';
import { createEditorCollection } from './createEditorCollection';
import type { ElementReactionDefinition } from '../../data/combat/elementReactions';
import { SEED_ELEMENT_REACTIONS } from '../../data/combat/elementReactions';
import type { StatusEffectId } from '../../data/combat/statusRules';

// Wave 1 — editable element-reaction rules (⬆ Progression tab). Queried by ElementReactionRuntime when a
// status effect is applied to a target.
export const useElementReactionStore = createEditorCollection<ElementReactionDefinition>({
  storageKey: 'aero-rescue-element-reactions-v1',
  seed: SEED_ELEMENT_REACTIONS,
  makeId: () => `rxn_${nanoid(6)}`,
});

// The first enabled reaction whose primaryStatus is one of the target's active statuses and whose
// triggerStatus matches the incoming status. Returns null if none.
export function reactionFor(activeStatusTypes: Set<string>, incomingStatus: StatusEffectId): ElementReactionDefinition | null {
  for (const rule of useElementReactionStore.getState().items) {
    if (rule.enabled === false) continue;
    if (rule.triggerStatus !== incomingStatus) continue;
    if (activeStatusTypes.has(rule.primaryStatus)) return rule;
  }
  return null;
}
