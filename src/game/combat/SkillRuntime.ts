import { nanoid } from 'nanoid';
import type { CombatSkillDefinition, CombatStats, DamageEvent, DamageResult, DamageableDefinition } from '../../types/game/combat';
import { queryHits, type HitTargetPoint, type HitVolumeWorld } from './HitVolumeRuntime';
import { resolveDamage } from './DamageResolver';
import { reflectedDamage } from './EliteAffixRuntime';
import { isReady, cooldownEndMs } from './CooldownManager';
import { canAfford, spendEnergy } from './EnergyManager';
import { isSpawnSkill, isDefenseSkill } from './skillBehaviors';
import { getTargetStatusEffects } from './StatusEffectRuntime';

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
  // Plays a skill's authored timeline of timed VFX/SFX (when skill.timelineEvents is present). Optional →
  // callers/tests without it fall back to the single effectDefinitionId.
  playSkillTimeline?: (skill: CombatSkillDefinition, caster: SkillCaster) => void;
  // Batch D model-driven behaviors (optional → Batch B callers/tests still valid).
  spawnFromSkill?: (skill: CombatSkillDefinition, caster: SkillCaster) => void;
  applyDefense?: (skill: CombatSkillDefinition, caster: SkillCaster) => void;
  displaceTarget?: (targetId: string, dx: number, dz: number) => void;
  moveCaster?: (dx: number, dz: number) => void;
  // Wave 6 — 'reflect' affix: a target may bounce a fraction of incoming damage back to the player.
  getAffixReflectFraction?: (targetId: string) => number | undefined;
  applyDamageToPlayer?: (amount: number) => void;
}

export interface SkillCastOutcome {
  ok: boolean;
  reason?: 'cooldown' | 'energy' | 'disabled';
  hitIds: string[];
  results: DamageResult[];
}

// Batch L — optional upgrade multipliers (from the per-skill upgrade level) applied at cast time.
export interface CastOptions { forceCrit?: boolean; critChanceAdd?: number; damageMultiplier?: number; cooldownMultiplier?: number; energyMultiplier?: number }

export function castSkill(skill: CombatSkillDefinition, caster: SkillCaster, deps: SkillCastDeps, options: CastOptions = {}): SkillCastOutcome {
  if (skill.enabled === false) return { ok: false, reason: 'disabled', hitIds: [], results: [] };

  const ignoreCd = deps.ignoreCooldown || skill.debug?.ignoreCooldown === true;
  if (!isReady(deps.cooldowns, skill.id, deps.nowMs, ignoreCd)) return { ok: false, reason: 'cooldown', hitIds: [], results: [] };

  // Batch L — upgrade multipliers scale energy / cooldown / damage for this cast (default 1 = base).
  const energyCost = skill.energyCost * (options.energyMultiplier ?? 1);
  const cooldownSeconds = skill.cooldownSeconds * (options.cooldownMultiplier ?? 1);

  const ignoreEnergy = deps.ignoreEnergyCost || skill.debug?.ignoreEnergyCost === true;
  const stats = deps.getStats(caster.characterId);
  if (stats && !canAfford(stats, energyCost, ignoreEnergy)) return { ok: false, reason: 'energy', hitIds: [], results: [] };

  // Spend energy + start cooldown up-front (a cast is committed even on a whiff).
  if (stats) deps.setEnergy(caster.characterId, spendEnergy(stats, energyCost, ignoreEnergy));
  deps.startCooldown(skill.id, cooldownEndMs(deps.nowMs, cooldownSeconds, ignoreCd));

  const playSkillEffect = () => {
    // An authored timeline (timed VFX/SFX) takes over when present; otherwise fire the single effect as before.
    if (skill.timelineEvents?.length && deps.playSkillTimeline) deps.playSkillTimeline(skill, caster);
    else if (skill.effectDefinitionId && deps.playEffect) deps.playEffect(skill.effectDefinitionId, `skill_${nanoid(6)}`, caster);
  };

  // Batch D — defense skills set a defensive state (no hit volume).
  if (isDefenseSkill(skill)) {
    deps.applyDefense?.(skill, caster);
    playSkillEffect();
    return { ok: true, hitIds: [], results: [] };
  }
  // Batch D — spawn skills (projectile / summon / terrain) render real GLB models instead of an instant hit.
  if (isSpawnSkill(skill)) {
    deps.spawnFromSkill?.(skill, caster);
    playSkillEffect();
    return { ok: true, hitIds: [], results: [] };
  }
  // Charge / dash — shove the caster forward before the melee hit lands.
  if ((skill.attackType === 'charge' || skill.attackType === 'dash') && deps.moveCaster) {
    const dist = (skill.speed ?? 6) * 0.4;
    deps.moveCaster(Math.sin(caster.headingRad) * dist, Math.cos(caster.headingRad) * dist);
  }

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
      // Chase precision: a scanned/weakpoint-exposed target takes +50% from precision/weakpoint attacks.
      const precision = template.attackTags.includes('precision') || template.attackTags.includes('weakpoint');
      const upgraded = template.amount * (options.damageMultiplier ?? 1);
      // Batch O — armor-broken targets take bonus damage (magnitude = bonus fraction).
      const effects = getTargetStatusEffects(id);
      const armorBreak = effects.find((e) => e.type === 'armor-broken');
      const armorMult = armorBreak ? 1 + armorBreak.magnitude : 1;
      // Wave 6 — poise-broken opens the same kind of damage window (stacks multiplicatively with armor-broken).
      const poiseBreak = effects.find((e) => e.type === 'poise-broken');
      const poiseMult = poiseBreak ? 1 + poiseBreak.magnitude : 1;
      const amount = Math.round(((target as { scanned?: boolean }).scanned && precision ? upgraded * 1.5 : upgraded) * armorMult * poiseMult);
      const event: DamageEvent = {
        id: `dmg_${nanoid(6)}`,
        sourceId: caster.characterId,
        sourceType: 'player',
        targetId: id,
        targetType: 'dummy',
        amount,
        damageType: template.damageType,
        attackTags: [...template.attackTags, ...(skill.targetRules.bonusAgainstTags ?? [])],
        canCrit: template.canCrit || options.forceCrit,
        critMultiplier: template.critMultiplier,
        hitPoint: [target.x, target.y, target.z],
        metadata: (options.forceCrit || options.critChanceAdd) ? { forceCrit: options.forceCrit, critChanceAdd: options.critChanceAdd } : undefined,
      };
      const result = resolveDamage(event, def, vitals);
      deps.applyResult(result);
      deps.pushDamageResult(result);
      // Wave 6 — 'reflect' affix: bounce a fraction of the dealt damage back to the player (one hop, not a cast).
      const reflectFrac = deps.getAffixReflectFraction?.(id);
      if (reflectFrac && result.finalAmount > 0) deps.applyDamageToPlayer?.(reflectedDamage(result.finalAmount, reflectFrac));
      results.push(result);
    }
  }

  // Pull / push — displace hit targets toward (pull) or away from (push) the caster.
  if ((skill.attackType === 'pull' || skill.attackType === 'push') && deps.displaceTarget) {
    const force = (skill.knockbackForce ?? 4) * (skill.attackType === 'pull' ? -1 : 1);
    for (const id of hitIds) {
      const target = targets.find((t) => t.id === id);
      if (!target) continue;
      const dx = target.x - caster.x, dz = target.z - caster.z, d = Math.hypot(dx, dz) || 1;
      deps.displaceTarget(id, (dx / d) * force, (dz / d) * force);
    }
  }

  playSkillEffect();
  return { ok: true, hitIds, results };
}
