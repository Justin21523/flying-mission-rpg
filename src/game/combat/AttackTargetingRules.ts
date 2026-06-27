import type { CombatTarget } from '../../stores/game/combatTargetStore';
import { hasStatusEffect } from './StatusEffectRuntime';
import type { AttackArchetype } from './AttackArchetypeRegistry';

export function canAttackTarget(archetype: AttackArchetype, target: CombatTarget): boolean {
  if (target.defeatedAt) return false;
  if (archetype === 'repair-beam') return !!target.isObstacle || target.definitionId.includes('device');
  if (archetype === 'shield-break') return target.shield > 0 || !!target.maxShield || !!target.isBossWeakpoint;
  if (archetype === 'scan-cone') return !hasStatusEffect(target, 'scanned');
  if (archetype === 'heavy-break') return !!target.isObstacle || target.archetype === 'quake-walker' || target.archetype === 'elite-sentinel';
  return !!target.isEnemy || !!target.isBossEntity || !!target.isObstacle;
}
