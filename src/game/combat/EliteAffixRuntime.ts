import type { CombatTarget } from '../../stores/game/combatTargetStore';
import type { AffixId, AffixPolicy } from '../../data/combat/eliteAffixes';
import { getAffixDef } from '../../stores/game/useEliteAffixStore';

// Wave 1 — Elite Affix runtime. rollAffixes() picks affixes per the policy; applyAffixesToTarget() mutates a
// freshly-spawned CombatTarget (mirrors EliteEncounterDirector's spawn-then-scale pattern) and stashes the
// per-frame / on-death values on the ai blackboard so CombatEnemyAiHost + CombatDirector can read them cheaply
// without re-querying the store.

// Pick affixes for one enemy. rng defaults to Math.random (injectable for tests).
export function rollAffixes(policy: AffixPolicy | undefined, rng: () => number = Math.random): AffixId[] {
  if (!policy || policy.allowedAffixIds.length === 0 || policy.maxPerEnemy <= 0) return [];
  if (rng() >= policy.chancePerEnemy) return [];
  const pool = [...policy.allowedAffixIds];
  const picked: AffixId[] = [];
  const max = Math.min(policy.maxPerEnemy, pool.length);
  while (picked.length < max && pool.length > 0) {
    const idx = Math.floor(rng() * pool.length) % pool.length;
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked;
}

// Apply the rolled affixes to a live target. Returns the applied ids (filtered to enabled/known affixes).
export function applyAffixesToTarget(target: CombatTarget, affixIds: AffixId[]): AffixId[] {
  const applied: AffixId[] = [];
  const ai = (target.aiData ??= {});
  for (const id of affixIds) {
    const def = getAffixDef(id);
    if (!def || def.enabled === false) continue;
    if (def.hpMult && def.hpMult !== 1) { target.maxHp = Math.round(target.maxHp * def.hpMult); target.hp = target.maxHp; }
    if (def.speedMult && target.moveSpeed) target.moveSpeed = target.moveSpeed * def.speedMult;
    if (def.addShield) { target.maxShield = (target.maxShield ?? 0) + def.addShield; target.shield = (target.shield ?? 0) + def.addShield; }
    if (def.onDeathExplosion) { ai.affixVolatileRadius = def.onDeathExplosion.radius; ai.affixVolatileDamage = def.onDeathExplosion.damage; }
    if (def.regenPerSec) ai.affixRegenPerSec = def.regenPerSec;
    if (def.lifestealFraction) ai.affixLifesteal = def.lifestealFraction;
    if (def.berserk) { ai.affixBerserkThreshold = def.berserk.hpThreshold; ai.affixBerserkSpeedMult = def.berserk.speedMult; } // base move speed captured lazily on first tick
    if (def.onDeathSummon) { ai.affixSummonCount = def.onDeathSummon.count; target.affixSummonEnemyId = def.onDeathSummon.enemyId; }
    applied.push(id);
  }
  if (applied.length > 0) {
    target.affixIds = [...(target.affixIds ?? []), ...applied];
    target.scale = (target.scale ?? 1) * 1.2; // elite silhouette
  }
  return applied;
}

// Wave 5 — pure per-frame affix helpers (consumed by CombatDirector.tickEliteAffixes; unit-tested here).
export function affixRegenedHp(hp: number, maxHp: number, perSec: number, dt: number): number {
  return Math.min(maxHp, hp + perSec * dt);
}
export function berserkMoveSpeed(baseSpeed: number, hp: number, maxHp: number, threshold: number, speedMult: number): number {
  return baseSpeed * (maxHp > 0 && hp / maxHp < threshold ? speedMult : 1);
}

// 'vampiric' affix — heal the attacking enemy by lifestealFraction × damage it dealt to the player. No-op for
// non-vampiric enemies. Called wherever an enemy damages the player (melee paths + the projectile/summon callback).
export function vampiricHeal(enemy: CombatTarget, dmg: number): void {
  const ls = enemy.aiData?.affixLifesteal;
  if (ls && dmg > 0) enemy.hp = Math.min(enemy.maxHp, enemy.hp + dmg * ls);
}
