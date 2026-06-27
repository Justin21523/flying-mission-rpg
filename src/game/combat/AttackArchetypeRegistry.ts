import type { AttackType, CombatSkillDefinition, HitVolumeShape } from '../../types/game/combat';
import type { StatusEffectType } from './StatusEffectRuntime';

export type AttackArchetype =
  | 'melee-arc'
  | 'dash-line'
  | 'ranged-projectile'
  | 'aoe-ring'
  | 'aoe-field'
  | 'beam'
  | 'summon-object'
  | 'physics-projectile'
  | 'repair-beam'
  | 'scan-cone'
  | 'shield-break'
  | 'heavy-break'
  | 'control-field'
  | 'ultimate-cinematic';

export type AttackArchetypeDefinition = {
  archetype: AttackArchetype;
  attackTypes: AttackType[];
  hitVolumeShape: HitVolumeShape;
  targetRules: string[];
  defaultStatusEffects: StatusEffectType[];
  enemyReaction: string;
  obstacleReaction: string;
  bossWeakpointReaction: string;
};

export const ATTACK_ARCHETYPE_REGISTRY: Record<AttackArchetype, AttackArchetypeDefinition> = {
  'melee-arc': { archetype: 'melee-arc', attackTypes: ['melee'], hitVolumeShape: 'arc', targetRules: ['enemy', 'obstacle'], defaultStatusEffects: [], enemyReaction: 'stagger-light', obstacleReaction: 'chip', bossWeakpointReaction: 'chip' },
  'dash-line': { archetype: 'dash-line', attackTypes: ['dash', 'charge'], hitVolumeShape: 'line', targetRules: ['enemy'], defaultStatusEffects: ['knocked-back'], enemyReaction: 'knockback', obstacleReaction: 'none', bossWeakpointReaction: 'graze' },
  'ranged-projectile': { archetype: 'ranged-projectile', attackTypes: ['projectile', 'homing', 'lobbed'], hitVolumeShape: 'sphere', targetRules: ['enemy', 'boss'], defaultStatusEffects: [], enemyReaction: 'hit-pop', obstacleReaction: 'impact', bossWeakpointReaction: 'precision-hit' },
  'aoe-ring': { archetype: 'aoe-ring', attackTypes: ['ring-aoe', 'shockwave'], hitVolumeShape: 'ring', targetRules: ['enemy', 'obstacle'], defaultStatusEffects: ['knocked-back'], enemyReaction: 'stagger-area', obstacleReaction: 'area-chip', bossWeakpointReaction: 'reduced-area-hit' },
  'aoe-field': { archetype: 'aoe-field', attackTypes: ['dot-zone', 'terrain'], hitVolumeShape: 'cylinder', targetRules: ['enemy', 'hazard'], defaultStatusEffects: ['slowed'], enemyReaction: 'field-tick', obstacleReaction: 'field-tick', bossWeakpointReaction: 'field-tick' },
  beam: { archetype: 'beam', attackTypes: ['line-pierce'], hitVolumeShape: 'line', targetRules: ['enemy', 'boss-weakpoint'], defaultStatusEffects: [], enemyReaction: 'beam-hit', obstacleReaction: 'beam-cut', bossWeakpointReaction: 'weakpoint-hit' },
  'summon-object': { archetype: 'summon-object', attackTypes: ['summon', 'trap'], hitVolumeShape: 'sphere', targetRules: ['enemy'], defaultStatusEffects: ['taunted'], enemyReaction: 'decoy-focus', obstacleReaction: 'block', bossWeakpointReaction: 'none' },
  'physics-projectile': { archetype: 'physics-projectile', attackTypes: ['projectile', 'lobbed'], hitVolumeShape: 'sphere', targetRules: ['enemy', 'obstacle'], defaultStatusEffects: ['knocked-back'], enemyReaction: 'physics-impact', obstacleReaction: 'break-heavy', bossWeakpointReaction: 'heavy-chip' },
  'repair-beam': { archetype: 'repair-beam', attackTypes: ['none'], hitVolumeShape: 'line', targetRules: ['device', 'npc', 'obstacle'], defaultStatusEffects: ['repairing'], enemyReaction: 'none', obstacleReaction: 'repair', bossWeakpointReaction: 'none' },
  'scan-cone': { archetype: 'scan-cone', attackTypes: ['fan'], hitVolumeShape: 'cone', targetRules: ['enemy', 'boss-weakpoint', 'hazard'], defaultStatusEffects: ['scanned', 'weakpoint-exposed'], enemyReaction: 'reveal', obstacleReaction: 'reveal', bossWeakpointReaction: 'expose' },
  'shield-break': { archetype: 'shield-break', attackTypes: ['heavy', 'line-pierce'], hitVolumeShape: 'box', targetRules: ['shielded-enemy', 'boss-weakpoint'], defaultStatusEffects: ['shield-broken'], enemyReaction: 'shield-break', obstacleReaction: 'barrier-break', bossWeakpointReaction: 'shield-break' },
  'heavy-break': { archetype: 'heavy-break', attackTypes: ['heavy', 'shockwave'], hitVolumeShape: 'box', targetRules: ['obstacle', 'armored-enemy'], defaultStatusEffects: ['stunned'], enemyReaction: 'heavy-stagger', obstacleReaction: 'break', bossWeakpointReaction: 'armor-chip' },
  'control-field': { archetype: 'control-field', attackTypes: ['pull', 'push', 'dot-zone'], hitVolumeShape: 'cylinder', targetRules: ['enemy'], defaultStatusEffects: ['restrained', 'slowed'], enemyReaction: 'control', obstacleReaction: 'none', bossWeakpointReaction: 'reduced-control' },
  'ultimate-cinematic': { archetype: 'ultimate-cinematic', attackTypes: ['air-support', 'boss-weakpoint'], hitVolumeShape: 'sphere', targetRules: ['enemy', 'obstacle', 'boss-weakpoint'], defaultStatusEffects: ['weakpoint-exposed'], enemyReaction: 'cinematic-hit', obstacleReaction: 'cinematic-break', bossWeakpointReaction: 'cinematic-weakpoint' },
};

export function inferAttackArchetype(skill: CombatSkillDefinition): AttackArchetype {
  const damageType = skill.damageEvents?.[0]?.damageType;
  if (skill.skillType === 'ultimate-placeholder') return 'ultimate-cinematic';
  if (damageType === 'repair') return 'repair-beam';
  if (damageType === 'shield-break') return 'shield-break';
  if (skill.attackType === 'dash' || skill.attackType === 'charge') return 'dash-line';
  if (skill.attackType === 'ring-aoe' || skill.attackType === 'shockwave') return 'aoe-ring';
  if (skill.attackType === 'dot-zone' || skill.attackType === 'terrain') return 'aoe-field';
  if (skill.attackType === 'line-pierce') return 'beam';
  if (skill.attackType === 'summon' || skill.attackType === 'trap') return 'summon-object';
  if (skill.attackType === 'fan') return damageType === 'stun' ? 'scan-cone' : 'melee-arc';
  if (skill.attackType === 'heavy') return 'heavy-break';
  if (skill.attackType === 'pull' || skill.attackType === 'push') return 'control-field';
  if (skill.attackType === 'projectile' || skill.attackType === 'homing' || skill.attackType === 'lobbed') return 'ranged-projectile';
  return 'melee-arc';
}
