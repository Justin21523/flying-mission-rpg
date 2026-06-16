import { useCombatStore } from '../../stores/game/useCombatStore';
import { useCombatTargetStore, liveTargets, displaceTarget } from '../../stores/game/combatTargetStore';
import { useCombatSpawnStore, queueSpawnImpact } from '../../stores/game/combatSpawnStore';
import { useCharacterStore } from '../../stores/game/useCharacterStore';
import { useSupportRuntimeStore } from '../../stores/game/supportRuntimeStore';
import { activeSupportShieldReduction } from '../../stores/game/useSupportCombatStore';
import { getCombatSkill, getCombatStatsPreset } from '../../stores/game/editorCombatStore';
import { getEffectiveDamageable } from './enemyRuntime';
import { statsFromPreset, type DamageEvent, type DamageEventTemplate } from '../../types/game/combat';
import { robotHandle } from '../destination/robotHandle';
import { castSkill, type SkillCaster, type SkillCastDeps, type SkillCastOutcome, type CastOptions } from './SkillRuntime';
import { regenEnergy } from './EnergyManager';
import { regenShield, applyPlayerDamage } from './ShieldManager';
import { resolveDamage } from './DamageResolver';
import { playEffect, cleanupExpired } from './effects/CombatEffectDirector';
import { spawnFromSkill, buildDefenseState, resolveDefense } from './skillBehaviors';
import { tickCombatSpawns } from './combatSpawns';
import { cleanupAllClonesForPhaseChange } from '../vfx/CloneAbilityRuntime';

// Main combat entry point — wires SkillRuntime + the pure modules to the real stores and the live player
// position (robotHandle). UI never calls the resolver directly; React only calls these functions.

const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
const lastShieldDamageMs: Record<string, number> = {};

// The character currently driving the robot (control switch aware), else the selected character.
export function activeCombatantId(): string | undefined {
  return useSupportRuntimeStore.getState().ownership.controlledCharacterId ?? useCharacterStore.getState().selectedCharacterId ?? undefined;
}

export function registerPlayerCombatant(characterId: string | undefined): void {
  if (!characterId) return;
  const store = useCombatStore.getState();
  store.setActiveCombatant(characterId);
  if (store.playerStatsByCharacterId[characterId]) return; // keep existing vitals
  const preset = getCombatStatsPreset(characterId);
  if (preset) store.setCombatStats(characterId, statsFromPreset(preset));
}

export function initializeCombatForZone(): void {
  registerPlayerCombatant(activeCombatantId());
}

export function shutdownCombat(): void {
  useCombatTargetStore.getState().reset();
  useCombatSpawnStore.getState().reset();
  useCombatStore.getState().resetCombat();
  // Batch F.7 — clear all live cinematic VFX + clone instances on combat exit so nothing persists across a
  // phase/zone change (cleanupAllForPhaseChange existed but was never called — fixed here).
  cleanupAllClonesForPhaseChange();
}

export function cleanup(): void {
  shutdownCombat();
}

// Build the live SkillRuntime deps from the stores.
function makeDeps(): SkillCastDeps {
  const cs = useCombatStore.getState();
  return {
    nowMs: nowMs(),
    ignoreEnergyCost: cs.ignoreEnergyCost || cs.godMode,
    ignoreCooldown: cs.ignoreCooldown || cs.godMode,
    cooldowns: cs.activeCooldowns,
    getStats: (id) => useCombatStore.getState().playerStatsByCharacterId[id],
    setEnergy: (id, energy) => useCombatStore.getState().updateCombatStats(id, { energy }),
    startCooldown: (skillId, untilMs) => useCombatStore.getState().startCooldown(skillId, untilMs),
    getTargets: () => liveTargets.filter((t) => !t.defeatedAt).map((t) => ({ id: t.id, x: t.x, y: t.y, z: t.z, definitionId: t.definitionId, scanned: t.scanned })),
    getDamageable: (defId) => getEffectiveDamageable(defId),
    getVitals: (targetId) => { const t = liveTargets.find((x) => x.id === targetId); return t ? { hp: t.hp, shield: t.shield } : undefined; },
    applyResult: (result) => useCombatTargetStore.getState().applyResult(result),
    pushDamageResult: (result) => useCombatStore.getState().pushDamageResult(result),
    playEffect: (effectDefId, skillInstanceId, caster) => playEffect(effectDefId, { skillInstanceId, x: caster.x, y: caster.y, z: caster.z, headingRad: caster.headingRad }),
    spawnFromSkill: (skill, caster) => spawnFromSkill(skill, caster),
    applyDefense: (skill, caster) => useCombatStore.getState().setDefense(caster.characterId, buildDefenseState(skill, nowMs())),
    displaceTarget: (id, dx, dz) => displaceTarget(id, dx, dz),
  };
}

// Apply a damage template to a single live combat target (used by enemy projectile/AoE impacts via the
// spawn tick — player-faction spawns hitting enemies).
export function damageTargetByTemplate(targetId: string, template: DamageEventTemplate): void {
  const t = liveTargets.find((x) => x.id === targetId);
  if (!t || t.defeatedAt) return;
  const def = getEffectiveDamageable(t.definitionId);
  if (!def) return;
  const event: DamageEvent = {
    id: `dmg_${Math.random().toString(36).slice(2, 8)}`,
    sourceId: 'spawn', sourceType: 'player', targetId, targetType: 'dummy',
    amount: template.amount, damageType: template.damageType, attackTags: template.attackTags,
    canCrit: template.canCrit, critMultiplier: template.critMultiplier, hitPoint: [t.x, t.y, t.z],
  };
  const result = resolveDamage(event, def, { hp: t.hp, shield: t.shield });
  useCombatTargetStore.getState().applyResult(result);
  useCombatStore.getState().pushDamageResult(result);
}

export function castSkillById(skillId: string, casterId?: string, options?: CastOptions): SkillCastOutcome | null {
  const skill = getCombatSkill(skillId);
  if (!skill) return null;
  const characterId = casterId ?? activeCombatantId();
  if (!characterId) return null;
  const caster: SkillCaster = { characterId, x: robotHandle.pos.x, y: robotHandle.pos.y, z: robotHandle.pos.z, headingRad: robotHandle.heading };
  return castSkill(skill, caster, makeDeps(), options);
}

// Apply incoming damage to the player (debug / future enemy attacks). Dummies go through applyResult.
export function applyDamageToPlayer(amount: number, characterId?: string): void {
  const id = characterId ?? activeCombatantId();
  if (!id) return;
  const cs = useCombatStore.getState();
  const stats = cs.playerStatsByCharacterId[id];
  if (!stats || cs.godMode || stats.invulnerable) return;

  // Active defense (front-shield / barrier / iframe / absorb / reflect) reduces or redirects the hit.
  const defense = resolveDefense(cs.activeDefenseByCharacterId[id], amount, nowMs());
  if (defense.energyGain > 0) cs.updateCombatStats(id, { energy: Math.min(stats.maxEnergy, stats.energy + defense.energyGain) });
  if (defense.reflectAmount > 0) {
    const enemy = liveTargets.find((t) => !t.defeatedAt);
    if (enemy) damageTargetByTemplate(enemy.id, { amount: defense.reflectAmount, damageType: 'energy', attackTags: ['reflect'] });
  }
  // Batch E — Shield Support dome reduces incoming damage while active.
  const reduction = activeSupportShieldReduction();
  const reduced = reduction > 0 ? defense.finalAmount * (1 - reduction) : defense.finalAmount;
  if (defense.iframed || reduced <= 0) return;

  const next = applyPlayerDamage(stats, reduced);
  lastShieldDamageMs[id] = nowMs();
  cs.updateCombatStats(id, { hp: next.hp, shield: next.shield, downed: next.hp <= 0 });
}

// Debug: apply a damage event directly to a live dummy target (no hit volume).
export function applyDamageToTarget(event: DamageEvent): void {
  const t = liveTargets.find((x) => x.id === event.targetId);
  if (!t) return;
  const def = getEffectiveDamageable(t.definitionId);
  if (!def) return;
  const result = resolveDamage(event, def, { hp: t.hp, shield: t.shield });
  useCombatTargetStore.getState().applyResult(result);
  useCombatStore.getState().pushDamageResult(result);
}

// Per-frame tick — energy/shield regen for the active combatant, effect + dead-target sweeps.
export function update(dt: number): void {
  const cs = useCombatStore.getState();
  const id = cs.activeCombatantId;
  if (id) {
    const stats = cs.playerStatsByCharacterId[id];
    if (stats) {
      const energy = regenEnergy(stats, dt, cs.ignoreEnergyCost || cs.godMode);
      const shield = regenShield(stats, dt, nowMs() - (lastShieldDamageMs[id] ?? -1e9));
      const patch: Partial<typeof stats> = {};
      if (energy !== stats.energy) patch.energy = energy;
      if (shield !== stats.shield) patch.shield = shield;
      if (cs.godMode && stats.hp < stats.maxHp) patch.hp = stats.maxHp;
      if (Object.keys(patch).length) cs.updateCombatStats(id, patch);
    }
  }
  cleanupExpired(nowMs());

  // Tick model-driven spawns (projectiles / summons / terrain) + sweep expired/impacted.
  tickCombatSpawns(dt, {
    nowMs: nowMs(),
    enemyTargets: () => liveTargets.filter((t) => !t.defeatedAt).map((t) => ({ id: t.id, x: t.x, y: t.y, z: t.z })),
    playerPos: () => ({ x: robotHandle.pos.x, z: robotHandle.pos.z }),
    targetPos: (tid) => { const t = liveTargets.find((x) => x.id === tid); return t ? { x: t.x, z: t.z } : undefined; },
    damageTarget: (tid, tpl) => damageTargetByTemplate(tid, tpl),
    damagePlayer: (amt) => applyDamageToPlayer(amt),
    impact: (s) => queueSpawnImpact(s.x, s.y, s.z),
  });
  useCombatSpawnStore.getState().sweep();
  useCombatTargetStore.getState().removeDead();
}
