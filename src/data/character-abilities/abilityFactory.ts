import { skill, hv } from '../combat/skillBuilders';
import type { CombatSkillDefinition, AttackType, HitVolumeShape, DamageType, DefenseType, DamageEventTemplate } from '../../types/game/combat';
import type { CinematicAbilityDefinition, AbilityCategory, AbilitySlot } from '../../types/abilityArsenalTypes';
import type { CinematicEffectDefinition, CinematicEffectFamily } from '../../types/cinematicVfxTypes';
import type { CloneAbilityDefinition, CloneType, CloneBehavior, CloneSpawnPattern, CloneMaterialMode, CloneGameplayEffect } from '../../types/cloneAbilityTypes';
import { authoredEffect } from '../cinematic-vfx/characterEffects';
import { visualScaleForCategory, modelScaleMultiplierForCategory } from '../cinematic-vfx/modelScalePresets';
import { clonePoseModelSet } from '../../game/vfx/ClonePoseModelPresets';
import { defaultCloneTimeline } from '../../game/vfx/CloneStateTimelineRuntime';
import { buildCloneEffect } from '../../game/vfx/CloneEffectDirector';

// Batch F.7 — clone-ability config carried on a clone-category AbilitySpec. Drives the CloneAbilityDefinition +
// its authored effect (pose-switching model layers) instead of the signature-piece authoredEffect path.
export interface CloneSpec {
  cloneType: CloneType;
  cloneBehavior: CloneBehavior;
  spawnPattern: CloneSpawnPattern;
  materialMode: CloneMaterialMode;
  maxCloneCount: number;
  duration: number;
  gameplay: CloneGameplayEffect;
}

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
  clone?: CloneSpec; // present on clone-category specs
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
  clone?: CloneAbilityDefinition; // present on clone-category abilities
}

export function buildAbility(characterId: string, family: CinematicEffectFamily, color: string, spec: AbilitySpec): BuiltAbility {
  const short = characterId.replace('char_', '');
  const skillId = `${short}_${spec.key}`;
  const effectId = `${skillId}_fx`;
  const intensity = spec.intensity ?? (spec.category === 'ultimate' ? 5 : spec.category === 'signature' || spec.category === 'clone' ? 3 : spec.category === 'defense' ? 2 : 2);
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
    visualScale: visualScaleForCategory(spec.category),
    gameplayHooks: spec.hooks ?? { affectsEnemies: spec.category !== 'defense' && spec.category !== 'signature' },
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

  // Clone-category abilities author their effect from the clone definition (pose-switching model layers) rather
  // than the signature-piece path; they also emit a CloneAbilityDefinition for the clone store / Edit Mode.
  if (spec.category === 'clone' && spec.clone) {
    const cl = spec.clone;
    const poseModelSet = clonePoseModelSet(characterId, cl.cloneType);
    const stateTimeline = defaultCloneTimeline(cl.cloneType, poseModelSet, cl.duration);
    const clone: CloneAbilityDefinition = {
      id: skillId, cloneAbilityId: skillId, characterId, abilityId: skillId, name: spec.name,
      cloneType: cl.cloneType, poseModelSet, cloneBehavior: cl.cloneBehavior, spawnPattern: cl.spawnPattern,
      durationSeconds: cl.duration, maxCloneCount: cl.maxCloneCount, stateTimeline,
      gameplayEffect: cl.gameplay,
      visualConfig: {
        modelScaleMultiplier: modelScaleMultiplierForCategory('clone'),
        opacity: cl.materialMode === 'solid' ? 1 : 0.8,
        materialMode: cl.materialMode,
        particleEffectId: `${effectId}_particles`,
        geometryEffectId: `${effectId}_geometry`,
        fogCloudEffectId: `${effectId}_fog`,
        cameraFeedbackId: `${effectId}_camera`,
      },
      editModeConfig: { editable: true, canChangePoseModels: true, canChangeSpawnPattern: true, canChangeStateTimeline: true, canChangeEffects: true },
    };
    const cloneEffect = buildCloneEffect(clone, color);
    return { skill: sk, ability, effect: cloneEffect, clone };
  }

  const effect = authoredEffect(characterId, spec.key, effectId, spec.name, color, spec.category, skillId);
  return { skill: sk, ability, effect };
}

// Build all of a character's abilities at once.
export function buildCharacter(characterId: string, family: CinematicEffectFamily, color: string, specs: AbilitySpec[]): BuiltAbility[] {
  return specs.map((s) => buildAbility(characterId, family, color, s));
}

// Terse builder for a clone-category AbilitySpec (Batch F.7). One call per clone ability in each hero file.
export interface CloneSpecOpts {
  key: string; name: string; desc: string; slot: AbilitySlot;
  cloneType: CloneType; behavior: CloneBehavior; pattern: CloneSpawnPattern; material: CloneMaterialMode;
  maxCloneCount: number; duration: number; gameplay: CloneGameplayEffect;
  attackType?: AttackType; dmg?: number; cooldown: number; energy: number;
  shape?: HitVolumeShape; range?: number; length?: number; width?: number;
  defenseType?: DefenseType; defenseValue?: number; skillDuration?: number; tags?: string[];
}
export function cloneSpec(o: CloneSpecOpts): AbilitySpec {
  return {
    key: o.key, name: o.name, desc: o.desc, category: 'clone', slot: o.slot,
    attackType: o.attackType, dmg: o.dmg, cooldown: o.cooldown, energy: o.energy,
    shape: o.shape, range: o.range, length: o.length, width: o.width,
    defenseType: o.defenseType, defenseValue: o.defenseValue, duration: o.skillDuration,
    tags: o.tags ?? ['clone'],
    clone: { cloneType: o.cloneType, cloneBehavior: o.behavior, spawnPattern: o.pattern, materialMode: o.material, maxCloneCount: o.maxCloneCount, duration: o.duration, gameplay: o.gameplay },
  };
}
