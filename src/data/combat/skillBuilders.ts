import type { CombatSkillDefinition, HitVolumeDefinition } from '../../types/game/combat';

// Terse builders for authoring the large model-driven skill catalog (heroes / enemies / boss). Each returns
// a fully-formed CombatSkillDefinition with sane defaults so the seed files stay readable.

const hv = (over: Partial<HitVolumeDefinition>): HitVolumeDefinition => ({
  id: `hv_${over.shape ?? 'sphere'}`,
  shape: over.shape ?? 'sphere',
  origin: over.origin ?? 'character-forward',
  activeDurationSeconds: over.activeDurationSeconds ?? 0.2,
  ...over,
});

export interface SkillSpec extends Partial<CombatSkillDefinition> {
  id: string;
  name: string;
  attackType?: CombatSkillDefinition['attackType'];
}

export function skill(spec: SkillSpec): CombatSkillDefinition {
  const at = spec.attackType ?? 'melee';
  const category = spec.skillCategory
    ?? (spec.defenseType && spec.defenseType !== 'none' ? 'defense'
      : at === 'summon' ? 'special'
      : at === 'projectile' || at === 'homing' || at === 'lobbed' || at === 'air-support' ? 'ranged'
      : at === 'ring-aoe' || at === 'fan' || at === 'shockwave' || at === 'dot-zone' || at === 'terrain' ? 'aoe'
      : at === 'heavy' ? 'heavy' : 'normal');
  return {
    id: spec.id,
    name: spec.name,
    description: spec.description,
    skillType: spec.skillType ?? 'special',
    skillCategory: category,
    attackType: at,
    defenseType: spec.defenseType,
    faction: spec.faction ?? 'player',
    ownerCharacterId: spec.ownerCharacterId,
    slot: spec.slot,
    inputBinding: spec.inputBinding ?? '',
    energyCost: spec.energyCost ?? 0,
    cooldownSeconds: spec.cooldownSeconds ?? 1,
    durationSeconds: spec.durationSeconds,
    damageEvents: spec.damageEvents ?? (spec.attackType && ['summon', 'terrain', 'trap'].includes(spec.attackType) ? undefined : [{ amount: 15, damageType: 'impact', attackTags: [at] }]),
    hitVolume: spec.hitVolume ?? hv({ shape: 'cone', radius: 4, angleDegrees: 90 }),
    targetRules: spec.targetRules ?? { validTargetTypes: ['enemy', 'dummy', 'boss'] },
    effectDefinitionId: spec.effectDefinitionId,
    modelPrefabId: spec.modelPrefabId,
    projectilePrefabId: spec.projectilePrefabId,
    impactEffectPrefabId: spec.impactEffectPrefabId,
    summonPrefabId: spec.summonPrefabId,
    projectile: spec.projectile,
    summon: spec.summon,
    terrain: spec.terrain,
    defenseValue: spec.defenseValue,
    knockbackForce: spec.knockbackForce,
    stunDurationSeconds: spec.stunDurationSeconds,
    speed: spec.speed,
    editorMeta: spec.editorMeta ?? { displayName: spec.name, themeColor: '#cbd5e1' },
    enabled: spec.enabled ?? true,
  };
}

export { hv };
