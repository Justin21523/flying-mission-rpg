import type { CombatSkillDefinition, DamageEventTemplate, ActiveDefenseState } from '../../types/game/combat';
import { SPAWN_ATTACK_TYPES } from '../../types/game/combat';
import { spawnCombat, type SpawnRequest, type CombatSpawnKind } from '../../stores/game/combatSpawnStore';
import type { SkillCaster } from './SkillRuntime';

// Maps a skill's attackType + model config into concrete combat-spawn requests (projectiles / summons /
// terrain), and computes defense state. The builders are PURE (no store access) so they're unit-testable;
// the appliers call the spawn store. Hit-volume attack types (melee/aoe/etc.) are handled by SkillRuntime's
// existing hit-volume path — this module only covers the model-spawn + defense + displacement behaviors.

const DEFAULT_DAMAGE = (skill: CombatSkillDefinition): DamageEventTemplate =>
  skill.damageEvents?.[0] ?? { amount: 0, damageType: 'impact', attackTags: [] };

export function isSpawnSkill(skill: CombatSkillDefinition): boolean {
  return !!skill.attackType && SPAWN_ATTACK_TYPES.includes(skill.attackType);
}

export function isDefenseSkill(skill: CombatSkillDefinition): boolean {
  return skill.skillCategory === 'defense' || (!!skill.defenseType && skill.defenseType !== 'none');
}

// Build the spawn requests a skill produces (0..N). Pure — used by the runtime + tests.
export function buildSpawnRequests(skill: CombatSkillDefinition, caster: SkillCaster): SpawnRequest[] {
  const at = skill.attackType;
  if (!at || !SPAWN_ATTACK_TYPES.includes(at)) return [];
  const faction = skill.faction ?? 'player';
  const dirX = Math.sin(caster.headingRad);
  const dirZ = Math.cos(caster.headingRad);
  const damage = DEFAULT_DAMAGE(skill);

  if (at === 'summon') {
    const cfg = skill.summon;
    const model = cfg?.modelAssetId ?? skill.summonPrefabId;
    const count = cfg?.count ?? 1;
    const out: SpawnRequest[] = [];
    for (let i = 0; i < count; i++) {
      out.push({
        kind: 'summon', faction, modelAssetId: model, color: skill.editorMeta?.themeColor ?? '#a5f3fc',
        x: caster.x, y: caster.y, z: caster.z, dirX, dirZ, speed: 6, movement: cfg?.behavior ?? 'seek',
        lifetimeSeconds: cfg?.lifetimeSeconds ?? 8, radius: cfg?.attackRadius ?? 3,
        damage: { ...damage, amount: cfg?.attackDamage ?? damage.amount }, attackIntervalSeconds: cfg?.attackIntervalSeconds ?? 1,
        offsetForward: 1.5,
      });
    }
    return out;
  }

  if (at === 'terrain' || at === 'trap') {
    const cfg = skill.terrain;
    const model = cfg?.modelAssetId ?? skill.modelPrefabId;
    const count = cfg?.count ?? 1;
    const out: SpawnRequest[] = [];
    for (let i = 0; i < count; i++) {
      out.push({
        kind: 'terrain', faction, modelAssetId: model, color: skill.editorMeta?.themeColor ?? '#94a3b8',
        x: caster.x, y: caster.y, z: caster.z, dirX, dirZ, speed: 0, movement: 'stationary',
        lifetimeSeconds: cfg?.lifetimeSeconds ?? 8, radius: cfg?.radius ?? 2.5,
        damage: { ...damage, amount: cfg?.damagePerTick ?? (at === 'trap' ? damage.amount : 0) },
        blocksMovement: cfg?.blocksMovement ?? (at === 'terrain'),
        attackIntervalSeconds: cfg?.tickIntervalSeconds ?? 0.8,
        offsetForward: 3 + i * 2.4,
      });
    }
    return out;
  }

  // projectile / homing / lobbed / air-support
  const cfg = skill.projectile;
  const model = cfg?.modelAssetId ?? skill.projectilePrefabId;
  const count = cfg?.count ?? 1;
  const spread = cfg?.spreadDeg ?? 0;
  const movement = at === 'homing' ? 'homing' : at === 'lobbed' ? 'lobbed' : 'linear';
  const out: SpawnRequest[] = [];
  for (let i = 0; i < count; i++) {
    const a = count > 1 ? ((i / (count - 1)) - 0.5) * (spread * Math.PI / 180) : 0;
    const ca = Math.cos(a), sa = Math.sin(a);
    const fx = dirX * ca - dirZ * sa;
    const fz = dirX * sa + dirZ * ca;
    out.push({
      kind: 'projectile' as CombatSpawnKind, faction, modelAssetId: model, color: skill.editorMeta?.themeColor ?? '#fca5a5',
      x: caster.x, y: caster.y, z: caster.z, dirX: fx, dirZ: fz, speed: cfg?.speed ?? skill.speed ?? 16,
      movement, lifetimeSeconds: cfg?.lifetimeSeconds ?? 2.5, radius: cfg?.radius ?? 2, damage,
      impactEffectDefId: cfg?.onImpactEffectDefId ?? skill.impactEffectPrefabId,
      offsetForward: at === 'air-support' ? 0 : 1.4,
    });
  }
  return out;
}

export function spawnFromSkill(skill: CombatSkillDefinition, caster: SkillCaster): void {
  for (const req of buildSpawnRequests(skill, caster)) spawnCombat(req);
}

// Compute the active-defense state a defense skill grants. Pure.
export function buildDefenseState(skill: CombatSkillDefinition, nowMs: number): ActiveDefenseState {
  const duration = (skill.durationSeconds ?? 2) * 1000;
  return {
    type: skill.defenseType ?? 'front-shield',
    untilMs: nowMs + duration,
    value: skill.defenseValue ?? 0.5,
  };
}

// Resolve incoming damage against an active defense. Pure — used by applyDamageToPlayer + tests.
export interface DefenseOutcome { finalAmount: number; energyGain: number; reflectAmount: number; iframed: boolean }
export function resolveDefense(state: ActiveDefenseState | undefined, amount: number, nowMs: number): DefenseOutcome {
  if (!state || nowMs >= state.untilMs) return { finalAmount: amount, energyGain: 0, reflectAmount: 0, iframed: false };
  switch (state.type) {
    case 'quick-dash-iframe':
    case 'perfect-guard':
      return { finalAmount: 0, energyGain: 0, reflectAmount: 0, iframed: true };
    case 'absorb-energy':
      return { finalAmount: 0, energyGain: amount * (state.value || 1), reflectAmount: 0, iframed: false };
    case 'reflect-wall':
      return { finalAmount: 0, energyGain: 0, reflectAmount: amount, iframed: false };
    case 'omni-barrier':
    case 'front-shield':
    case 'damage-reduction-zone':
    case 'cover-spawn':
    case 'knockback-wave':
    case 'team-rescue':
    default: {
      const reduce = Math.min(0.95, Math.max(0, state.value || 0.5));
      return { finalAmount: Math.round(amount * (1 - reduce)), energyGain: 0, reflectAmount: 0, iframed: false };
    }
  }
}
