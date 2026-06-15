import { nanoid } from 'nanoid';
import type { CombatSkillDefinition, CombatStats, DamageEvent, DamageResult, DamageableDefinition } from '../../types/game/combat';
import { queryHits, type HitTargetPoint, type HitVolumeWorld } from './HitVolumeRuntime';
import { resolveDamage } from './DamageResolver';
import { isReady, cooldownEndMs } from './CooldownManager';
import { canAfford, spendEnergy } from './EnergyManager';

// Casts one skill. Dependencies are injected (not read from stores) so the casting logic is unit-testable
// with a mock target registry; CombatDirector wires the real stores in. The hit detection + damage model
// reuse HitVolumeRuntime + DamageResolver.

export interface SkillCaster {
  characterId: string;
  x: number; y: number; z: number;
  headingRad: number;
}

export interface SkillCastDeps {
  nowMs: number;
  ignoreEnergyCost: boolean;
  ignoreCooldown: boolean;
  cooldowns: Record<string, number>;
  getStats: (characterId: string) => CombatStats | undefined;
  setEnergy: (characterId: string, energy: number) => void;
  startCooldown: (skillId: string, untilMs: number) => void;
  getTargets: () => (HitTargetPoint & { definitionId: string })[];
  getDamageable: (definitionId: string) => DamageableDefinition | undefined;
  getVitals: (targetId: string) => { hp: number; shield: number } | undefined;
  applyResult: (result: DamageResult) => void;
  pushDamageResult: (result: DamageResult) => void;
  playEffect?: (effectDefId: string, skillInstanceId: string, caster: SkillCaster) => void;
}

export interface SkillCastOutcome {
  ok: boolean;
  reason?: 'cooldown' | 'energy' | 'disabled';
  hitIds: string[];
  results: DamageResult[];
}

export function castSkill(skill: CombatSkillDefinition, caster: SkillCaster, deps: SkillCastDeps): SkillCastOutcome {
  if (skill.enabled === false) return { ok: false, reason: 'disabled', hitIds: [], results: [] };

  const ignoreCd = deps.ignoreCooldown || skill.debug?.ignoreCooldown === true;
  if (!isReady(deps.cooldowns, skill.id, deps.nowMs, ignoreCd)) return { ok: false, reason: 'cooldown', hitIds: [], results: [] };

  const ignoreEnergy = deps.ignoreEnergyCost || skill.debug?.ignoreEnergyCost === true;
  const stats = deps.getStats(caster.characterId);
  if (stats && !canAfford(stats, skill.energyCost, ignoreEnergy)) return { ok: false, reason: 'energy', hitIds: [], results: [] };

  // Spend energy + start cooldown up-front (a cast is committed even on a whiff).
  if (stats) deps.setEnergy(caster.characterId, spendEnergy(stats, skill.energyCost, ignoreEnergy));
  deps.startCooldown(skill.id, cooldownEndMs(deps.nowMs, skill.cooldownSeconds, ignoreCd));

  // Build the world hit volume from the caster facing (forward = sin/cos of heading).
  const world: HitVolumeWorld = {
    originX: caster.x,
    originZ: caster.z,
    dirX: Math.sin(caster.headingRad),
    dirZ: Math.cos(caster.headingRad),
  };
  const targets = deps.getTargets();
  const hitIds = queryHits(skill.hitVolume, world, targets);

  // Resolve damage per hit (first damage event template this batch; merge target-rule tags).
  const template = skill.damageEvents?.[0];
  const results: DamageResult[] = [];
  if (template) {
    for (const id of hitIds) {
      const target = targets.find((t) => t.id === id);
      if (!target) continue;
      const def = deps.getDamageable(target.definitionId);
      const vitals = deps.getVitals(id);
      if (!def || !vitals) continue;
      const event: DamageEvent = {
        id: `dmg_${nanoid(6)}`,
        sourceId: caster.characterId,
        sourceType: 'player',
        targetId: id,
        targetType: 'dummy',
        amount: template.amount,
        damageType: template.damageType,
        attackTags: [...template.attackTags, ...(skill.targetRules.bonusAgainstTags ?? [])],
        canCrit: template.canCrit,
        critMultiplier: template.critMultiplier,
        hitPoint: [target.x, target.y, target.z],
      };
      const result = resolveDamage(event, def, vitals);
      deps.applyResult(result);
      deps.pushDamageResult(result);
      results.push(result);
    }
  }

  // Model-first effect (geometry / model component) — played at the caster origin.
  if (skill.effectDefinitionId && deps.playEffect) {
    deps.playEffect(skill.effectDefinitionId, `skill_${nanoid(6)}`, caster);
  }

  return { ok: true, hitIds, results };
}
