import { useCombatStore } from '../../stores/game/useCombatStore';
import { useCombatTargetStore, liveTargets, displaceTarget, type CombatTarget } from '../../stores/game/combatTargetStore';
import { awardKillReward } from '../progression/KillRewards';
import { useCodexStore } from '../../stores/game/useCodexStore';
import { evaluateCodexChallenges } from '../progression/CodexChallengeResolver';
import { useCombatSpawnStore, queueSpawnImpact } from '../../stores/game/combatSpawnStore';
import { useCharacterStore } from '../../stores/game/useCharacterStore';
import { useSupportRuntimeStore } from '../../stores/game/supportRuntimeStore';
import { activeSupportShieldReduction } from '../../stores/game/useSupportCombatStore';
import { getCombatSkill, getCombatStatsPreset, getEnemyDef } from '../../stores/game/editorCombatStore';
import { getEffectiveDamageable, spawnEnemyFromDef } from './enemyRuntime';
import { affixRegenedHp, berserkMoveSpeed, vampiricHeal, teleportStep } from './EliteAffixRuntime';
import { statsFromPreset, type DamageEvent, type DamageEventTemplate } from '../../types/game/combat';
import { robotHandle } from '../destination/robotHandle';
import { castSkill, type SkillCaster, type SkillCastDeps, type SkillCastOutcome, type CastOptions } from './SkillRuntime';
import { regenEnergy } from './EnergyManager';
import { regenShield, applyPlayerDamage } from './ShieldManager';
import { resolveDamage } from './DamageResolver';
import { playEffect, cleanupExpired } from './effects/CombatEffectDirector';
import { scheduleSkillTimeline } from './skillTimelinePreview';
import { playTimelineSound } from '../audio/playTimelineSound';
import { nanoid } from 'nanoid';
import { spawnFromSkill, buildDefenseState, resolveDefense } from './skillBehaviors';
import { tickCombatSpawns } from './combatSpawns';
import { cleanupAllClonesForPhaseChange } from '../vfx/CloneAbilityRuntime';
import { classifyDamageFeedback, type CombatFeedbackEvent } from './CombatFeedbackClassifier';
import { triggerGameFeelFromFeedback } from '../feel/GameFeelDirector';
import { getHangarBonuses } from '../progression/HangarBonusResolver';
import { getTargetStatusEffects, applyStatusEffect } from './StatusEffectRuntime';
import { tryTriggerReaction, type ReactionDeps } from './ElementReactionRuntime';
import { statusEffectsForSkill } from '../../stores/game/useStatusRuleStore';
import { useFusionRuntimeStore } from '../../stores/game/useFusionRuntimeStore';
import { useArenaRunStore } from '../../stores/game/useArenaRunStore';
import { getRunConfig } from '../../stores/game/useRunConfigStore';
import { getGameSettings } from '../../stores/game/useSettingsStore';
import { effectiveGodMode, difficultyDamageMult, runDamageMult, dmgScaleForMode } from './difficulty';
import { makeUtilityFeedback } from './CombatFeedbackClassifier';
import { playSfx } from '../audio/sfx';

// Batch O — partner-fusion sync granted by a successful parry (before Hangar scaling).
const PARRY_FUSION_REWARD = 30;

// Batch P — effective god-mode (dev toggle OR 'easy' difficulty) + incoming-damage multiplier (arena round +
// difficulty). Read live each hit so settings/run changes apply immediately.
const godNow = (devFlag: boolean) => effectiveGodMode(devFlag, getGameSettings().difficulty);
function incomingDamageMult(): number {
  const run = useArenaRunStore.getState();
  const scale = dmgScaleForMode(getRunConfig(), run.mode);
  return runDamageMult(run.active, run.round, scale) * difficultyDamageMult(getGameSettings().difficulty);
}

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
  if (preset) {
    const s = statsFromPreset(preset);
    // Batch L — apply account-wide Hangar bonuses (max HP / energy) to the freshly-registered combatant.
    const b = getHangarBonuses();
    s.maxHp += b.maxHpBonus; s.hp = s.maxHp;
    s.maxEnergy += b.maxEnergyBonus; s.energy = s.maxEnergy;
    // Wave 3 — Hangar 'Aegis Plating' grants a starting shield on combat entry.
    if (b.openingShield > 0) { s.maxShield = (s.maxShield ?? 0) + b.openingShield; s.shield = s.maxShield; }
    store.setCombatStats(characterId, s);
  }
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
    ignoreEnergyCost: cs.ignoreEnergyCost || godNow(cs.godMode),
    ignoreCooldown: cs.ignoreCooldown || godNow(cs.godMode),
    cooldowns: cs.activeCooldowns,
    getStats: (id) => useCombatStore.getState().playerStatsByCharacterId[id],
    setEnergy: (id, energy) => useCombatStore.getState().updateCombatStats(id, { energy }),
    startCooldown: (skillId, untilMs) => useCombatStore.getState().startCooldown(skillId, untilMs),
    getTargets: () => liveTargets.filter((t) => !t.defeatedAt).map((t) => ({ id: t.id, x: t.x, y: t.y, z: t.z, definitionId: t.definitionId, scanned: t.scanned })),
    getDamageable: (defId) => getEffectiveDamageable(defId),
    getVitals: (targetId) => { const t = liveTargets.find((x) => x.id === targetId); return t ? { hp: t.hp, shield: t.shield } : undefined; },
    applyResult: (result) => useCombatTargetStore.getState().applyResult(result),
    pushDamageResult: (result) => useCombatStore.getState().pushDamageResult(result),
    getAffixReflectFraction: (targetId) => liveTargets.find((t) => t.id === targetId)?.aiData?.affixReflectFraction, // Wave 6
    applyDamageToPlayer: (amount) => applyDamageToPlayer(amount), // Wave 6 — reflect bounce
    playEffect: (effectDefId, skillInstanceId, caster) => playEffect(effectDefId, { skillInstanceId, x: caster.x, y: caster.y, z: caster.z, headingRad: caster.headingRad }),
    playSkillTimeline: (skill, caster) => scheduleSkillTimeline(skill.timelineEvents ?? [], {
      onEffect: (id) => playEffect(id, { skillInstanceId: `skill_${nanoid(6)}`, x: caster.x, y: caster.y, z: caster.z, headingRad: caster.headingRad }),
      onSound: (sid) => playTimelineSound(sid),
    }),
    spawnFromSkill: (skill, caster) => spawnFromSkill(skill, caster),
    applyDefense: (skill, caster) => useCombatStore.getState().setDefense(caster.characterId, buildDefenseState(skill, nowMs())),
    displaceTarget: (id, dx, dz) => displaceTarget(id, dx, dz),
  };
}

function emitFeedback(event: CombatFeedbackEvent | null): void {
  if (!event) return;
  useCombatStore.getState().pushFeedbackEvent(event);
  triggerGameFeelFromFeedback(event);
}

function emitDamageFeedback(result: ReturnType<typeof resolveDamage>, skillId?: string): void {
  const target = liveTargets.find((x) => x.id === result.targetId);
  const skill = skillId ? getCombatSkill(skillId) : undefined;
  emitFeedback(classifyDamageFeedback({ result, skill, target }));
}

// Batch O — apply a damage template to every live enemy within `radius` of (x,z). Reuses the single-target
// path per hit (so kill rewards fire). Used by explosive obstacles + environmental hazards.
export function damageTargetsInRadius(x: number, z: number, radius: number, template: DamageEventTemplate): number {
  const r2 = radius * radius;
  let hits = 0;
  for (const t of [...liveTargets]) {
    if (t.defeatedAt || !t.isEnemy) continue;
    const dx = t.x - x, dz = t.z - z;
    if (dx * dx + dz * dz <= r2) { damageTargetByTemplate(t.id, template); hits++; }
  }
  return hits;
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
  emitDamageFeedback(result);
  // Wave 2 — poise accrual from spawn/AoE hits (reaction/dot bursts do not stagger).
  if (!template.attackTags?.includes('reaction') && !template.attackTags?.includes('dot')) accruePoise(targetId, template.staggerValue ?? 6);
  // Wave 1 — an elemental hit can detonate a compatible existing status (skip reaction bursts themselves to
  // avoid recursion). Covers burn-DoT ticks (fire) + projectile/AoE elemental impacts.
  if (!template.attackTags?.includes('reaction')) {
    const statuses = statusEffectsForSkill(new Set([template.damageType]), new Set(template.attackTags));
    for (const eff of statuses) tryTriggerReaction(targetId, eff, 'spawn', reactionDeps());
  }
}

// Wave 2 — poise/break: staggering hits fill an enemy's poise meter; full → a hard stagger (reuses the stun
// blackboard + stun ring) + a "Poise Broken!" feedback beat. Only enemies with a configured maxPoise take part.
const POISE_STUN_SECONDS = 2;
const POISE_DECAY_PER_SEC = 8;
const POISE_BREAK_NO_DECAY_MS = 600;
function accruePoise(targetId: string, amount: number): void {
  if (amount <= 0) return;
  const t = liveTargets.find((x) => x.id === targetId);
  if (!t || t.defeatedAt || !t.isEnemy || !t.maxPoise || t.maxPoise <= 0) return;
  const nowSec = nowMs() / 1000;
  if ((t.aiData?.stunUntil ?? 0) > nowSec) return; // already staggered — don't re-accumulate mid-stun
  t.poiseValue = (t.poiseValue ?? 0) + amount;
  if (t.poiseValue >= t.maxPoise) {
    t.poiseValue = 0;
    t.poiseBreakAt = nowMs();
    (t.aiData ??= {}).stunUntil = nowSec + POISE_STUN_SECONDS;
    applyStatusEffect(targetId, 'poise-broken', 'poise'); // Wave 6 — the break opens a +damage-taken window
    emitFeedback(makeUtilityFeedback('poise-break', targetId, undefined));
  }
}
// Poise contribution for a skill hit (explicit staggerValue, else an attack-type default).
function staggerForSkill(skillId?: string): number {
  const skill = skillId ? getCombatSkill(skillId) : undefined;
  const explicit = skill?.damageEvents?.[0]?.staggerValue;
  if (explicit != null) return explicit;
  const at = skill?.attackType;
  return at === 'heavy' || at === 'charge' ? 18 : at === 'melee' || at === 'shockwave' ? 10 : 6;
}
function decayPoise(dt: number): void {
  const now = nowMs();
  for (const t of liveTargets) {
    if (t.defeatedAt || !t.isEnemy || !t.poiseValue) continue;
    if (t.poiseBreakAt && now - t.poiseBreakAt < POISE_BREAK_NO_DECAY_MS) continue;
    t.poiseValue = Math.max(0, t.poiseValue - POISE_DECAY_PER_SEC * dt);
  }
}

// Wave 2 — execution finisher: a low-HP (or poise-broken) enemy can be finished for a cinematic + resource
// refund. Bosses/weakpoints are exempt. Reuses the shared kill-reward path so progression still fires.
const EXECUTE_HP_PCT = 0.25;
const EXECUTE_BROKEN_HP_PCT = 0.45;
export function executableTargetNear(x: number, z: number, maxDist = 10): CombatTarget | undefined {
  const nowSec = nowMs() / 1000;
  let best: CombatTarget | undefined;
  let bestD = maxDist * maxDist;
  for (const t of liveTargets) {
    if (t.defeatedAt || !t.isEnemy || t.executingAt || t.isBossEntity || t.isBossWeakpoint) continue;
    const broken = (t.aiData?.stunUntil ?? 0) > nowSec;
    if (t.hp / Math.max(1, t.maxHp) > (broken ? EXECUTE_BROKEN_HP_PCT : EXECUTE_HP_PCT)) continue;
    const d = (t.x - x) ** 2 + (t.z - z) ** 2;
    if (d <= bestD) { bestD = d; best = t; }
  }
  return best;
}
function awardExecutionReward(t: CombatTarget): void {
  awardKillReward(t); // EXP + coins (bypassed applyResult, so grant directly)
  const id = activeCombatantId();
  if (!id) return;
  const cs = useCombatStore.getState();
  const stats = cs.playerStatsByCharacterId[id];
  if (!stats) return;
  // Wave 3 — Hangar 'Executioner Protocol' scales the finisher refund.
  const refund = 30 * getHangarBonuses().executeRefundMult;
  cs.updateCombatStats(id, { energy: Math.min(stats.maxEnergy, stats.energy + refund), hp: Math.min(stats.maxHp, stats.hp + refund) });
}
export function castExecutionFinisher(targetId: string): boolean {
  const t = liveTargets.find((x) => x.id === targetId);
  if (!t || t.defeatedAt || t.executingAt || !t.isEnemy) return false;
  t.executingAt = nowMs();
  useCodexStore.getState().recordExecution(); // Wave 4 — execution challenge metric
  evaluateCodexChallenges();
  playEffect('fx_exec_grid', { skillInstanceId: `exec_${targetId}`, x: t.x, y: t.y, z: t.z, headingRad: 0 });
  emitFeedback(makeUtilityFeedback('execution', targetId, undefined));
  t.hp = 0;
  t.defeatedAt = nowMs() / 1000;
  awardExecutionReward(t);
  useCombatTargetStore.getState().bump();
  return true;
}
// Convenience: execute the nearest valid enemy to (x,z); returns true if one was finished.
export function tryExecuteNearest(x: number, z: number): boolean {
  const t = executableTargetNear(x, z);
  return t ? castExecutionFinisher(t.id) : false;
}

// Wave 1 — element-reaction deps wired to this module's damage/AoE/VFX (no cycle: ElementReactionRuntime
// never imports CombatDirector).
function reactionDeps(): ReactionDeps {
  return {
    nowMs: nowMs(),
    damageTarget: (id, tpl) => damageTargetByTemplate(id, tpl),
    damageInRadius: (x, z, r, tpl) => damageTargetsInRadius(x, z, r, tpl),
    playEffect: (effectId, _id, x, y, z) => { playEffect(effectId, { skillInstanceId: `rxn_${Math.round(nowMs())}`, x, y, z, headingRad: 0 }); },
  };
}

export function castSkillById(skillId: string, casterId?: string, options?: CastOptions): SkillCastOutcome | null {
  const skill = getCombatSkill(skillId);
  if (!skill) return null;
  const characterId = casterId ?? activeCombatantId();
  if (!characterId) return null;
  const caster: SkillCaster = { characterId, x: robotHandle.pos.x, y: robotHandle.pos.y, z: robotHandle.pos.z, headingRad: robotHandle.heading };
  const outcome = castSkill(skill, caster, makeDeps(), options);
  if (outcome.ok) {
    const stagger = staggerForSkill(skill.id);
    for (const result of outcome.results) {
      emitDamageFeedback(result, skill.id);
      if (result.finalAmount > 0 || result.hpDamage > 0) accruePoise(result.targetId, stagger); // Wave 2 — poise
    }
  }
  return outcome;
}

// Apply incoming damage to the player (debug / future enemy attacks). Dummies go through applyResult.
export function applyDamageToPlayer(amount: number, characterId?: string): void {
  const id = characterId ?? activeCombatantId();
  if (!id) return;
  const cs = useCombatStore.getState();
  const stats = cs.playerStatsByCharacterId[id];
  if (!stats || godNow(cs.godMode) || stats.invulnerable) return;

  // Active defense (front-shield / barrier / iframe / absorb / reflect / parry) reduces or redirects the hit.
  const defense = resolveDefense(cs.activeDefenseByCharacterId[id], amount, nowMs());
  // Batch O/P — a perfect parry fully negates the hit, rewards the partner-fusion gauge (Hangar-scaled), and
  // fires feedback (label "Parry!" + hitstop/slow-mo via the game-feel router).
  if (defense.wasParried) {
    useFusionRuntimeStore.getState().addSync(PARRY_FUSION_REWARD * getHangarBonuses().fusionChargeMult);
    emitFeedback(makeUtilityFeedback('parry', undefined, undefined));
    playSfx('ring');
  }
  if (defense.energyGain > 0) cs.updateCombatStats(id, { energy: Math.min(stats.maxEnergy, stats.energy + defense.energyGain) });
  if (defense.reflectAmount > 0) {
    const enemy = liveTargets.find((t) => !t.defeatedAt);
    if (enemy) damageTargetByTemplate(enemy.id, { amount: defense.reflectAmount, damageType: 'energy', attackTags: ['reflect'] });
  }
  // Batch E — Shield Support dome reduces incoming damage while active.
  const reduction = activeSupportShieldReduction();
  const afterShield = reduction > 0 ? defense.finalAmount * (1 - reduction) : defense.finalAmount;
  // Batch P — scale by arena round + difficulty so late Endless/Roguelite rounds (and hard mode) bite.
  const reduced = afterShield * incomingDamageMult();
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
  emitDamageFeedback(result);
}

// Per-frame tick — energy/shield regen for the active combatant, effect + dead-target sweeps.
// Batch O — burn DoT: accrue magnitude (dmg/sec) per burning enemy and apply whole-number ticks through the
// shared damage path (so kill rewards still fire). Accumulator clears as targets die/expire.
// Wave 5 — DoT statuses share this fractional-accumulator pattern (deal whole damage once accrued ≥ 1).
const DOT_SPECS = [
  { type: 'burning' as const, damageType: 'fire', tags: ['burn', 'dot'] },
  { type: 'bleed' as const, damageType: 'impact', tags: ['bleed', 'dot'] },
];
const dotAccum: Record<string, Record<string, number>> = {};
function tickStatusDots(dt: number): void {
  for (const t of liveTargets) {
    if (t.defeatedAt || !t.isEnemy) { delete dotAccum[t.id]; continue; }
    const effects = getTargetStatusEffects(t);
    for (const spec of DOT_SPECS) {
      const dot = effects.find((e) => e.type === spec.type);
      const acc = (dotAccum[t.id] ??= {});
      if (!dot) { acc[spec.type] = 0; continue; }
      acc[spec.type] = (acc[spec.type] ?? 0) + dot.magnitude * dt;
      if (acc[spec.type] >= 1) {
        const whole = Math.floor(acc[spec.type]);
        acc[spec.type] -= whole;
        damageTargetByTemplate(t.id, { amount: whole, damageType: spec.damageType as DamageEventTemplate['damageType'], attackTags: spec.tags });
      }
    }
  }
}

// Wave 5 — per-frame elite affix effects: 'regenerating' heals; 'berserk' frenzies (move speed) once wounded.
// Base move speed is captured lazily on first tick (after spawn-time affixes like 'swift' have applied).
function tickEliteAffixes(dt: number): void {
  for (const t of liveTargets) {
    if (t.defeatedAt || !t.isEnemy || !t.aiData) continue;
    const ai = t.aiData;
    if (ai.affixRegenPerSec && t.hp < t.maxHp) t.hp = affixRegenedHp(t.hp, t.maxHp, ai.affixRegenPerSec, dt);
    if (ai.affixBerserkThreshold != null && ai.affixBerserkSpeedMult != null) {
      if (ai.affixBaseMoveSpeed == null) ai.affixBaseMoveSpeed = t.moveSpeed ?? 0;
      t.moveSpeed = berserkMoveSpeed(ai.affixBaseMoveSpeed, t.hp, t.maxHp, ai.affixBerserkThreshold, ai.affixBerserkSpeedMult);
    }
    // Wave 6 — 'teleport' affix: blink toward the player on an interval.
    if (ai.affixTeleportIntervalMs != null && ai.affixTeleportRange != null) {
      ai.affixTeleportAccumMs = (ai.affixTeleportAccumMs ?? 0) + dt * 1000;
      if (ai.affixTeleportAccumMs >= ai.affixTeleportIntervalMs) {
        ai.affixTeleportAccumMs = 0;
        const next = teleportStep(t.x, t.z, robotHandle.pos.x, robotHandle.pos.z, ai.affixTeleportRange);
        // Wave 6 — blink VFX: a poof at the vacated spot AND the arrival spot so the jump reads clearly.
        if (next.x !== t.x || next.z !== t.z) {
          queueSpawnImpact(t.x, t.y, t.z);
          t.x = next.x; t.z = next.z;
          queueSpawnImpact(t.x, t.y, t.z);
        }
      }
    }
  }
}

export function update(dt: number): void {
  const cs = useCombatStore.getState();
  const id = cs.activeCombatantId;
  if (id) {
    const stats = cs.playerStatsByCharacterId[id];
    if (stats) {
      const energy = regenEnergy(stats, dt, cs.ignoreEnergyCost || godNow(cs.godMode));
      const shield = regenShield(stats, dt, nowMs() - (lastShieldDamageMs[id] ?? -1e9));
      const patch: Partial<typeof stats> = {};
      if (energy !== stats.energy) patch.energy = energy;
      if (shield !== stats.shield) patch.shield = shield;
      if (godNow(cs.godMode) && stats.hp < stats.maxHp) patch.hp = stats.maxHp;
      if (Object.keys(patch).length) cs.updateCombatStats(id, patch);
    }
  }
  cleanupExpired(nowMs());
  tickStatusDots(dt); // Batch O — burn damage-over-time
  tickEliteAffixes(dt); // Wave 5 — regenerating heal + berserk frenzy
  decayPoise(dt); // Wave 2 — poise meter regenerates when not being staggered

  // Tick model-driven spawns (projectiles / summons / terrain) + sweep expired/impacted.
  tickCombatSpawns(dt, {
    nowMs: nowMs(),
    enemyTargets: () => liveTargets.filter((t) => !t.defeatedAt).map((t) => ({ id: t.id, x: t.x, y: t.y, z: t.z })),
    playerPos: () => ({ x: robotHandle.pos.x, z: robotHandle.pos.z }),
    targetPos: (tid) => { const t = liveTargets.find((x) => x.id === tid); return t ? { x: t.x, z: t.z } : undefined; },
    damageTarget: (tid, tpl) => damageTargetByTemplate(tid, tpl),
    damagePlayer: (amt, casterId) => { applyDamageToPlayer(amt); if (casterId) { const c = liveTargets.find((t) => t.id === casterId); if (c) vampiricHeal(c, amt); } }, // Wave 5 — projectile/summon vampiric heal-back
    impact: (s) => queueSpawnImpact(s.x, s.y, s.z),
  });
  tickVolatileDeaths(); // Wave 1 — elite "volatile" affix: explode just-defeated enemies before they're swept.
  useCombatSpawnStore.getState().sweep();
  useCombatTargetStore.getState().removeDead();
}

// Wave 1 — one-shot AoE when a volatile-affixed enemy dies (read from the ai blackboard set at spawn). Runs in
// the tick (not in combatTargetStore.applyResult) to avoid a store→CombatDirector import cycle.
function tickVolatileDeaths(): void {
  for (const t of [...liveTargets]) {
    if (!t.defeatedAt) continue;
    // Wave 1 — volatile: one-shot AoE on death.
    if (t.aiData?.affixVolatileRadius && !t.affixExploded) {
      t.affixExploded = true;
      damageTargetsInRadius(t.x, t.z, t.aiData.affixVolatileRadius, { amount: t.aiData.affixVolatileDamage ?? 0, damageType: 'impact', attackTags: ['explosion', 'aoe', 'affix'] });
      queueSpawnImpact(t.x, t.y, t.z);
    }
    // Wave 5 — summoner: one-shot spawn a small swarm on death.
    if (t.aiData?.affixSummonCount && t.affixSummonEnemyId && !t.affixSummoned) {
      t.affixSummoned = true;
      const def = getEnemyDef(t.affixSummonEnemyId);
      if (def) for (let i = 0; i < t.aiData.affixSummonCount; i++) {
        const a = (i / t.aiData.affixSummonCount) * Math.PI * 2;
        spawnEnemyFromDef(def, t.x + Math.cos(a) * 2.5, t.z + Math.sin(a) * 2.5);
      }
    }
  }
}
