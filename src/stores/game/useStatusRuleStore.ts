import { nanoid } from 'nanoid';
import { createEditorCollection } from './createEditorCollection';
import type { StatusRuleDefinition, StatusEffectId } from '../../data/combat/statusRules';
import { SEED_STATUS_RULES } from '../../data/combat/statusRules';

// Batch O — editable status-effect rules (⬆ Progression tab). Read by CharacterUtilityResolver post-cast.
export const useStatusRuleStore = createEditorCollection<StatusRuleDefinition>({
  storageKey: 'aero-rescue-status-rules-v1',
  seed: SEED_STATUS_RULES,
  makeId: () => `rule_${nanoid(6)}`,
});

// Effects a skill (damageType set + attack-tag set) should apply, per the enabled rules.
export function statusEffectsForSkill(damageTypes: Set<string>, tags: Set<string>): StatusEffectId[] {
  const out: StatusEffectId[] = [];
  for (const rule of useStatusRuleStore.getState().items) {
    if (rule.enabled === false) continue;
    const hit = rule.damageTypes.some((d) => damageTypes.has(d)) || rule.tags.some((tg) => tags.has(tg));
    if (hit && !out.includes(rule.effect)) out.push(rule.effect);
  }
  return out;
}
