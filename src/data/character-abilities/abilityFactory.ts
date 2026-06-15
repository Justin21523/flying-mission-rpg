import { skill, hv } from '../combat/skillBuilders';
import type { CombatSkillDefinition, AttackType, HitVolumeShape, DamageType, DefenseType, DamageEventTemplate } from '../../types/game/combat';
import type { CinematicAbilityDefinition, AbilityCategory, AbilitySlot } from '../../types/abilityArsenalTypes';
import type { CinematicEffectDefinition, CinematicEffectFamily } from '../../types/cinematicVfxTypes';
import { authoredEffect } from '../cinematic-vfx/characterEffects';

// Compact ability factory (Batch F.5): one AbilitySpec → { skill (real CombatSkillDefinition for SkillRuntime),
// ability (CinematicAbilityDefinition wrapper), effect (unique CinematicEffectDefinition) }. Keeps the 8×11
// roster terse while every ability stays fully data-driven + cinematic.

export interface AbilitySpec {
  key: string;          // unique within character, e.g. 'dash_slash'
  name: string;
  desc: string;
  category: AbilityCategory;
  slot: AbilitySlot;
  attackType?: AttackType;
  dmg?: number;
  shieldDmg?: number;
  repair?: number;
  scan?: boolean;
  cooldown: number;
  energy: number;
  castTime?: number;
  duration?: number;
  shape?: HitVolumeShape;
  range?: number;
  angle?: number;
  length?: number;
  width?: number;
  tags?: string[];
  damageType?: DamageType;
  defenseType?: DefenseType;
  defenseValue?: number;
  knockback?: number;
  stun?: number;
  intensity?: number;
  hooks?: CinematicAbilityDefinition['gameplayHooks'];
}

// keyed-slot input bindings (Z/X/Y/H/B/N + ultimate); non-keyed slots are debug-cast only.
const SLOT_BINDING: Partial<Record<AbilitySlot, string>> = {
  'attack-1': 'KeyZ', 'attack-2': 'KeyX', 'attack-3': 'KeyY', 'attack-4': 'KeyH',
  'defense-1': 'KeyB', 'attack-5': 'KeyN', 'ultimate-1': 'KeyU',
};

export interface BuiltAbility {
  skill: CombatSkillDefinition;
  ability: CinematicAbilityDefinition;
  effect: CinematicEffectDefinition;
}

export function buildAbility(characterId: string, family: CinematicEffectFamily, color: string, spec: AbilitySpec): BuiltAbility {
  const short = characterId.replace('char_', '');
  const skillId = `${short}_${spec.key}`;
  const effectId = `${skillId}_fx`;
  const intensity = spec.intensity ?? (spec.category === 'ultimate' ? 5 : spec.category === 'defense' ? 2 : 2);
  const dType: DamageType = spec.damageType ?? (spec.repair ? 'repair' : family === 'wild' || family === 'stealth' || family === 'dance' ? 'energy' : 'impact');
  const tags = spec.tags ?? [family];

  const damageEvents: DamageEventTemplate[] | undefined =
    spec.dmg != null || spec.shieldDmg != null
      ? [{ amount: spec.dmg ?? 0, damageType: dType, attackTags: tags }]
      : undefined;

  // Spawn attackTypes (projectile/summon/terrain/lobbed/air-support) need a config so they actually deal
  // their damage (geometry fallback when no model). Hit-volume attackTypes ignore this.
  const at = spec.attackType;
  const spawnCfg: Pick<Partial<CombatSkillDefinition>, 'projectile' | 'summon' | 'terrain'> =
    at === 'summon'
      ? { summon: { count: spec.category === 'ultimate' ? 3 : 2, lifetimeSeconds: 8, behavior: 'seek', attackIntervalSeconds: 1, attackDamage: spec.dmg ?? 14, attackRadius: spec.range ?? 3 } }
      : at === 'terrain' || at === 'trap'
        ? { terrain: { count: 1, lifetimeSeconds: 5, radius: spec.range ?? 3, blocksMovement: true, damagePerTick: spec.dmg ?? 6, tickIntervalSeconds: 0.6 } }
        : at === 'projectile' || at === 'homing' || at === 'lobbed' || at === 'air-support'
          ? { projectile: { speed: at === 'lobbed' ? 12 : 16, lifetimeSeconds: 3, movement: at === 'homing' ? 'homing' : at === 'lobbed' ? 'lobbed' : 'linear', radius: spec.range ?? 2, count: at === 'air-support' ? 4 : 1, spreadDeg: at === 'air-support' ? 50 : 0 } }
          : {};

  const sk = skill({
    ...spawnCfg,
    id: skillId,
    ownerCharacterId: characterId,
    name: spec.name,
    description: spec.desc,
    attackType: spec.attackType ?? (spec.category === 'defense' ? 'none' : 'melee'),
    skillCategory: spec.category === 'ultimate' ? 'ultimate' : spec.category === 'defense' ? 'defense' : undefined,
    cooldownSeconds: spec.cooldown,
    energyCost: spec.energy,
    castTimeSeconds: spec.castTime,
    durationSeconds: spec.duration,
    damageEvents,
    hitVolume: hv({ shape: spec.shape ?? 'cone', radius: spec.range ?? 4, angleDegrees: spec.angle, length: spec.length, width: spec.width, activeDurationSeconds: 0.25 }),
    effectDefinitionId: effectId,
    defenseType: spec.defenseType,
    defenseValue: spec.defenseValue,
    knockbackForce: spec.knockback,
    stunDurationSeconds: spec.stun,
    editorMeta: { displayName: spec.name, themeColor: color },
  });

  const ability: CinematicAbilityDefinition = {
    id: skillId,
    characterId,
    name: spec.name,
    description: spec.desc,
    abilityCategory: spec.category,
    abilitySlot: spec.slot,
    inputBinding: SLOT_BINDING[spec.slot] ?? '',
    combat: {
      skillDefinitionId: skillId,
      damageType: dType,
      attackTags: tags,
      energyCost: spec.energy,
      cooldownSeconds: spec.cooldown,
      castTimeSeconds: spec.castTime,
      durationSeconds: spec.duration,
      hitVolume: sk.hitVolume,
      targetRules: sk.targetRules,
    },
    vfx: { cinematicEffectId: effectId },
    gameplayHooks: spec.hooks ?? { affectsEnemies: spec.category !== 'defense' },
    balance: {
      baseDamage: spec.dmg,
      shieldDamage: spec.shieldDmg,
      knockbackForce: spec.knockback,
      repairAmount: spec.repair,
      scanDurationSeconds: spec.scan ? (spec.duration ?? 8) : undefined,
      defenseReductionPercent: spec.defenseValue != null ? Math.round(spec.defenseValue * 100) : undefined,
    },
    editorMeta: { visualIntensity: intensity as 1 | 2 | 3 | 4 | 5, themeColor: color, notes: spec.desc },
    enabled: true,
  };

  const effect = authoredEffect(characterId, spec.key, effectId, spec.name, color, spec.category, skillId);
  return { skill: sk, ability, effect };
}

// Build all of a character's abilities at once.
export function buildCharacter(characterId: string, family: CinematicEffectFamily, color: string, specs: AbilitySpec[]): BuiltAbility[] {
  return specs.map((s) => buildAbility(characterId, family, color, s));
}
