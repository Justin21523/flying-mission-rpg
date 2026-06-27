import type { CombatSkillDefinition } from '../../types/game/combat';
import { inferAttackArchetype } from './AttackArchetypeRegistry';

export type AttackBalanceProfile = {
  archetype: string;
  damageMultiplier: number;
  cooldownMultiplier: number;
  energyMultiplier: number;
};

export function getAttackBalanceProfile(skill: CombatSkillDefinition): AttackBalanceProfile {
  const archetype = inferAttackArchetype(skill);
  if (archetype === 'ultimate-cinematic') return { archetype, damageMultiplier: 1.35, cooldownMultiplier: 1.15, energyMultiplier: 1.2 };
  if (archetype === 'repair-beam' || archetype === 'scan-cone') return { archetype, damageMultiplier: 0.15, cooldownMultiplier: 0.85, energyMultiplier: 0.75 };
  if (archetype === 'shield-break' || archetype === 'heavy-break') return { archetype, damageMultiplier: 1.1, cooldownMultiplier: 1.05, energyMultiplier: 1 };
  return { archetype, damageMultiplier: 1, cooldownMultiplier: 1, energyMultiplier: 1 };
}
