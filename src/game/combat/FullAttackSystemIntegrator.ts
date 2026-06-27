import type { CombatSkillDefinition } from '../../types/game/combat';
import type { CombatTarget } from '../../stores/game/combatTargetStore';
import { ATTACK_ARCHETYPE_REGISTRY, inferAttackArchetype } from './AttackArchetypeRegistry';
import { getAttackBalanceProfile } from './AttackBalanceRules';
import { canAttackTarget } from './AttackTargetingRules';
import { applyStatusEffect } from './StatusEffectRuntime';

export type IntegratedAttackPreview = {
  skillId: string;
  archetype: string;
  canHitTarget: boolean;
  statusEffects: string[];
  damageMultiplier: number;
  cooldownMultiplier: number;
  energyMultiplier: number;
};

export function previewIntegratedAttack(skill: CombatSkillDefinition, target: CombatTarget): IntegratedAttackPreview {
  const archetype = inferAttackArchetype(skill);
  const registry = ATTACK_ARCHETYPE_REGISTRY[archetype];
  const balance = getAttackBalanceProfile(skill);
  return {
    skillId: skill.id,
    archetype,
    canHitTarget: canAttackTarget(archetype, target),
    statusEffects: registry.defaultStatusEffects,
    damageMultiplier: balance.damageMultiplier,
    cooldownMultiplier: balance.cooldownMultiplier,
    energyMultiplier: balance.energyMultiplier,
  };
}

export function applyIntegratedAttackStatuses(skill: CombatSkillDefinition, targetId: string, sourceId: string): number {
  const archetype = inferAttackArchetype(skill);
  const effects = ATTACK_ARCHETYPE_REGISTRY[archetype].defaultStatusEffects;
  let applied = 0;
  for (const effect of effects) {
    if (applyStatusEffect(targetId, effect, sourceId)) applied += 1;
  }
  return applied;
}
