import { liveTargets, useCombatTargetStore, type CombatTarget } from '../../stores/game/combatTargetStore';
import { registerRuntimeDamageable } from '../combat/enemyRuntime';
import { spawnCombat } from '../../stores/game/combatSpawnStore';
import { applyDamageToPlayer } from '../combat/CombatDirector';
import { playEffect } from '../combat/effects/CombatEffectDirector';
import { robotHandle } from '../destination/robotHandle';
import { useAdvancedMissionZoneStore } from '../../stores/game/useAdvancedMissionZoneStore';
import { clearedObstacleIds, destroyedObstacleIds } from '../obstacles/ObstacleDirector';
import { useBossStore } from '../../stores/game/useBossStore';
import { getBoss, getBossForSegment, getBossPhase, getWeakpoint, getArena, getSummonWave } from '../../stores/game/useBossEditorStore';
import type { BossAttackPatternDefinition, BossRuntimeAttackEvent } from '../../types/game/boss';
import * as Arena from './BossArenaController';
import * as Weakpoint from './BossWeakpointController';
import * as Attack from './BossAttackController';
import * as Wave from './BossSummonWaveController';
import { isPhaseComplete, isFinalPhase, nextPhaseId, type BossPhaseProbe } from './BossPhaseController';
import * as ZoneAdapter from './BossZoneConditionAdapter';
import * as Signature from './BossSignatureMechanicController';
import { spawnEnemyFromDef } from '../combat/enemyRuntime';
import { getEnemyDef } from '../../stores/game/editorCombatStore';
import { useBossAttackStore } from '../../stores/game/useBossEditorStore';
import { grantReward } from '../progression/KillRewards';
import { enrageState } from './bossEncounterState';

// Top orchestrator for a boss encounter (Batch F). Spawns the boss body + weakpoints as hittable
// CombatTargets, drives phases/attacks/waves/weakpoints each frame, and records defeat/phase/weakpoint
// events into the zone store. Reuses CombatDirector/DamageResolver/EnemySpawnDirector/ObstacleDirector —
// no parallel damage or spawn logic.

const nowS = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
let bodyUid = 0;
let phaseStartedAt = 0;
let scriptedDamage = 0; // boss-body damage scripted during invulnerable phases (weakpoint destroys)
const recordedWaves = new Set<string>();
// Batch E — enrage runtime (intro is a visual overlay driven by runtime.timers.introUntil).
let fightStartedAt = 0;
let enrageTriggered = false;

function bossTarget(): CombatTarget | undefined {
  const id = useBossStore.getState().runtime?.targetId;
  return id ? liveTargets.find((t) => t.id === id) : undefined;
}

function getActivePatterns(): BossAttackPatternDefinition[] {
  const rt = useBossStore.getState().runtime;
  if (!rt) return [];
  return useBossAttackStore.getState().items.filter((a) => rt.activeAttackPatternIds.includes(a.id));
}

export function startBoss(bossId: string, overrideSpawnPos?: [number, number, number]): void {
  const def = getBoss(bossId);
  if (!def) return;
  scriptedDamage = 0;
  recordedWaves.clear();
  const arena = getArena(def.arenaId);
  // Batch P — random/arena-run bosses drop near the player (override); segmented bosses use the arena spot.
  const pos = overrideSpawnPos ?? arena?.bossSpawnPosition ?? [0, 0, 0];
  if (arena) Arena.lockArena(arena);

  registerRuntimeDamageable(def.damageable);
  const targetId = `bossbody_${bodyUid++}`;
  const maxHp = def.damageable.maxHp;
  const maxShield = def.damageable.maxShield ?? 0;
  useCombatTargetStore.getState().spawn({
    id: targetId, definitionId: def.damageable.id,
    hp: maxHp, maxHp, shield: maxShield, maxShield,
    x: pos[0], y: pos[1], z: pos[2], defeatedAt: 0,
    isBossEntity: true, bossId: def.id,
    modelAssetId: def.visual.modelPresetId, scale: def.visual.scale[0], color: def.visual.themeColor,
  });

  // Batch E — dramatic intro: a title-card overlay shows for intro.durationSeconds (timestamp in timers;
  // BossIntroOverlay reads it). The fight starts immediately underneath so the encounter flow is unchanged.
  const introDur = def.intro?.durationSeconds ?? 0;
  fightStartedAt = nowS();
  enrageTriggered = false;

  useBossStore.getState().setRuntime({
    bossInstanceId: `inst_${bodyUid}`, bossDefinitionId: bossId, targetId,
    status: 'active', activePhaseId: undefined, completedPhaseIds: [],
    currentHp: maxHp, maxHp, currentShield: maxShield, maxShield,
    activeWeakpointIds: [], destroyedWeakpointIds: [],
    activeAttackPatternIds: [], recentAttackEvents: [], activeSummonWaveIds: [], clearedSummonWaveIds: [],
    arenaLocked: Arena.isArenaLocked(), timers: introDur > 0 ? { introUntil: nowS() + introDur } : {},
    debug: { godMode: false, freezeBossAi: false },
  });
  if (introDur > 0 && def.intro?.cinematicEffectId) playEffect(def.intro.cinematicEffectId, { skillInstanceId: `bossintro_${bossId}`, x: pos[0], y: 1, z: pos[2], headingRad: 0 });
  enterPhase(def.startPhaseId);
}

export function enterPhase(phaseId: string): void {
  const rt = useBossStore.getState().runtime;
  const phase = getBossPhase(phaseId);
  if (!rt || !phase) return;
  phaseStartedAt = nowS();
  Weakpoint.despawnAll();
  const bt = bossTarget();
  for (const wid of phase.enabledWeakpointIds ?? []) {
    const wp = getWeakpoint(wid);
    if (wp && bt) Weakpoint.spawnWeakpoint(wp, { x: bt.x, y: bt.y, z: bt.z });
  }
  for (const wid of phase.enabledSummonWaveIds ?? []) {
    const wave = getSummonWave(wid);
    if (wave && wave.trigger.type === 'on-phase-start' && bt) Wave.triggerWave(wave, { x: bt.x, z: bt.z });
  }
  useBossStore.getState().patchRuntime({
    activeAttackPatternIds: [...phase.enabledAttackPatternIds],
    activeWeakpointIds: [...(phase.enabledWeakpointIds ?? [])],
    activeSummonWaveIds: [...(phase.enabledSummonWaveIds ?? [])],
  });
  useBossStore.getState().setActivePhase(phaseId);
}

export function completePhase(phaseId: string): void {
  const rt = useBossStore.getState().runtime;
  if (!rt) return;
  useBossStore.getState().markPhaseComplete(phaseId);
  ZoneAdapter.recordPhaseComplete(rt.bossDefinitionId, phaseId);
}

export function defeatBoss(): void {
  const rt = useBossStore.getState().runtime;
  if (!rt || rt.status === 'defeated') return;
  const bt = bossTarget();
  if (bt) { bt.hp = 0; bt.defeatedAt = nowS(); }
  Weakpoint.despawnAll();
  for (const wid of getBoss(rt.bossDefinitionId)?.summonWaveIds ?? []) { const w = getSummonWave(wid); if (w) Wave.cleanupWave(w); }
  Arena.unlockArena();
  useBossStore.getState().setStatus('defeated');
  useBossStore.getState().patchRuntime({ arenaLocked: false, currentHp: 0 });
  ZoneAdapter.recordBossDefeated(rt.bossDefinitionId);
  // Batch L — boss kill grants a large EXP/coin lump (scaled by the boss's max HP).
  const bossMaxHp = getBoss(rt.bossDefinitionId)?.damageable.maxHp ?? 500;
  grantReward(Math.round(bossMaxHp / 4), Math.round(bossMaxHp / 6));
  useCombatTargetStore.getState().bump();
}

function applyWeakpointDestroyed(weakpointId: string, effect: import('../../types/game/boss').BossWeakpointDefinition['effectOnDestroyed']): void {
  const rt = useBossStore.getState().runtime;
  const bt = bossTarget();
  if (!rt || !bt) return;
  const phase = getBossPhase(rt.activePhaseId);
  const invuln = !!phase?.bossModifiers?.invulnerableUntilWeakpointExposed;
  if (effect.removeBossShield) bt.shield = Math.max(0, bt.shield - effect.removeBossShield);
  if (effect.damageBossAmount) {
    if (invuln) scriptedDamage += effect.damageBossAmount;
    else bt.hp = Math.max(0, bt.hp - effect.damageBossAmount);
  }
  useBossStore.getState().recordWeakpointDestroyed(weakpointId);
  ZoneAdapter.recordWeakpointDestroyed(rt.bossDefinitionId, weakpointId);
}

export function update(): void {
  const rt = useBossStore.getState().runtime;
  if (!rt || rt.status === 'defeated' || rt.status === 'inactive') return;
  const bt = bossTarget();
  if (!bt) return;
  const now = nowS();
  const phase = getBossPhase(rt.activePhaseId);
  if (!phase) return;
  const frozen = rt.debug?.freezeBossAi;
  const bossShieldBroken = bt.maxShield > 0 && bt.shield <= 0;

  // Weakpoints (expose triggers + destroyed detection).
  for (const ev of Weakpoint.update(bossShieldBroken, now)) applyWeakpointDestroyed(ev.weakpointId, ev.effect);

  // Invulnerable phases: pin boss-body hp to (maxHp - scriptedDamage) so only weakpoint destroys reduce it.
  if (phase.bossModifiers?.invulnerableUntilWeakpointExposed) bt.hp = Math.max(0, bt.maxHp - scriptedDamage);

  // Batch E — enrage: after a time limit the boss permanently hits harder (one-shot cinematic + HUD flag).
  const bossDef = getBoss(rt.bossDefinitionId);
  const enrage = enrageState(now - fightStartedAt, bossDef?.enrage);
  if (enrage.enraged && !enrageTriggered) {
    enrageTriggered = true;
    if (bossDef?.enrage?.cinematicEffectId) playEffect(bossDef.enrage.cinematicEffectId, { skillInstanceId: `bossenrage_${rt.bossDefinitionId}`, x: bt.x, y: 1, z: bt.z, headingRad: 0 });
  }

  // Wave 1 — per-boss signature mechanic (runs on top of the shared pipeline; effects injected to avoid a cycle).
  if (!frozen && bossDef?.signatureMechanic) {
    Signature.update(bossDef.signatureMechanic, {
      now, phaseId: rt.activePhaseId, bossPos: { x: bt.x, z: bt.z }, playerPos: { x: robotHandle.pos.x, z: robotHandle.pos.z },
      enrageActive: enrage.enraged,
      applyPlayerDamage: (amount) => applyDamageToPlayer(amount),
      spawnEnemy: (enemyDefId, x, z) => { const d = getEnemyDef(enemyDefId); return d ? spawnEnemyFromDef(d, x, z).id : undefined; },
      isAlive: (targetId) => { const t = liveTargets.find((x) => x.id === targetId); return !!t && !t.defeatedAt; },
      healBoss: (amount) => { bt.hp = Math.min(bt.maxHp, bt.hp + amount); },
      regenBossShield: (amount) => { if (bt.maxShield > 0) bt.shield = Math.min(bt.maxShield, bt.shield + amount); },
      playEffect: (effectId, x, z) => { if (effectId) playEffect(effectId, { skillInstanceId: `bosssig_${effectId}_${Math.round(now * 100)}`, x, y: 0.5, z, headingRad: 0 }); },
    });
  }

  // Attacks.
  if (!frozen) {
    const dmgMult = (phase.bossModifiers?.damageMultiplier ?? 1) * enrage.damageMult;
    const attackEvents = Attack.update(getActivePatterns(), {
      now, bossPos: { x: bt.x, z: bt.z }, playerPos: { x: robotHandle.pos.x, z: robotHandle.pos.z }, damageMultiplier: dmgMult,
      damagePlayer: (amount) => applyDamageToPlayer(amount),
      spawnProjectile: (p) => {
        const dx = robotHandle.pos.x - bt.x, dz = robotHandle.pos.z - bt.z;
        const d = Math.hypot(dx, dz) || 1;
        spawnCombat({ kind: 'projectile', faction: 'boss', modelAssetId: p.projectileModelAssetId, x: bt.x, y: 1.5, z: bt.z, dirX: dx / d, dirZ: dz / d, speed: 14, movement: 'linear', lifetimeSeconds: 3, radius: p.hitVolume.radius ?? 1.5, damage: p.damageEventTemplate ?? { amount: 8, damageType: 'energy', attackTags: ['boss'] } });
      },
      triggerSummonWave: (waveId) => { const w = getSummonWave(waveId); if (w) Wave.triggerWave(w, { x: bt.x, z: bt.z }); },
      playVisual: (effectId, x, z) => { if (effectId) playEffect(effectId, { skillInstanceId: `boss_${effectId}`, x, y: 0.5, z, headingRad: 0 }); },
    });
    if (attackEvents.length > 0) {
      const bossId = rt.bossDefinitionId;
      const phaseId = rt.activePhaseId;
      const runtimeEvents: BossRuntimeAttackEvent[] = attackEvents.map((ev) => ({
        id: `${bossId}_${ev.patternId}_${ev.kind}_${Math.round(now * 1000)}`,
        bossId,
        phaseId,
        patternId: ev.patternId,
        patternType: ev.patternType,
        kind: ev.kind,
        atMs: now * 1000,
      }));
      useBossStore.getState().recordAttackEvents(runtimeEvents);
    }
  }

  // Summon waves cleared?
  for (const wid of rt.activeSummonWaveIds) {
    if (recordedWaves.has(wid)) continue;
    const w = getSummonWave(wid);
    if (w && Wave.isWaveCleared(w)) { recordedWaves.add(wid); useBossStore.getState().recordWaveCleared(wid); ZoneAdapter.recordWaveCleared(rt.bossDefinitionId, wid); }
  }

  // Sync hp/shield (+ enrage timer for the HUD) → store.
  useBossStore.getState().patchRuntime({
    currentHp: bt.hp, currentShield: bt.shield,
    timers: { ...rt.timers, enraged: enrage.enraged ? 1 : 0, enrageRemaining: Number.isFinite(enrage.remaining) ? Math.round(enrage.remaining) : -1 },
  });

  // Defeat on hp 0.
  if (bt.hp <= 0) { defeatBoss(); return; }

  // Phase completion.
  const z = useAdvancedMissionZoneStore.getState();
  const probe: BossPhaseProbe = {
    bossHpPercent: bt.hp / Math.max(1, bt.maxHp),
    destroyedWeakpointIds: new Set(useBossStore.getState().runtime?.destroyedWeakpointIds ?? []),
    clearedSummonWaveIds: new Set(useBossStore.getState().runtime?.clearedSummonWaveIds ?? []),
    clearedObstacleIds: new Set([...clearedObstacleIds(), ...destroyedObstacleIds()]),
    usedSupportAbilityIds: new Set(z.usedSupportAbilityIds),
    completedPhaseIds: new Set(rt.completedPhaseIds),
    phaseElapsedSeconds: now - phaseStartedAt,
    debugCompletePhase: rt.debug?.forcePhaseId === phase.id ? false : undefined,
  };
  if (isPhaseComplete(phase, probe)) {
    completePhase(phase.id);
    const boss = getBoss(rt.bossDefinitionId);
    if (boss && isFinalPhase(phase, boss.finalPhaseIds)) defeatBoss();
    else { const np = nextPhaseId(phase); if (np) enterPhase(np); }
  }
}

// Start the segment's boss once when the player enters its segment (idempotent).
export function initializeBossForSegment(segmentId: string): void {
  const def = getBossForSegment(segmentId);
  if (!def) return;
  const rt = useBossStore.getState().runtime;
  if (rt && rt.bossDefinitionId === def.id) return; // already running / defeated
  if (rt && rt.status !== 'defeated') return;
  startBoss(def.id);
}

export function cleanup(): void {
  Weakpoint.despawnAll();
  Weakpoint.reset();
  Wave.reset();
  Attack.reset();
  Arena.reset();
  Signature.reset();
  const id = useBossStore.getState().runtime?.targetId;
  if (id) { const i = liveTargets.findIndex((t) => t.id === id); if (i >= 0) liveTargets.splice(i, 1); }
  useBossStore.getState().reset();
  scriptedDamage = 0;
  recordedWaves.clear();
}

// ---- Debug helpers ----
export function debugForcePhase(phaseId: string): void { enterPhase(phaseId); }
export function debugExposeWeakpoint(weakpointId: string): void { Weakpoint.exposeWeakpoint(weakpointId); }
export function debugDestroyWeakpoint(weakpointId: string): void { Weakpoint.destroyWeakpoint(weakpointId); }
export function debugBreakShield(): void { const bt = bossTarget(); if (bt) bt.shield = 0; }
export function debugDamageBoss(amount: number): void { const bt = bossTarget(); if (bt) bt.hp = Math.max(0, bt.hp - amount); }
export function debugKillBoss(): void { defeatBoss(); }
export function debugFreezeAi(freeze: boolean): void { useBossStore.getState().setDebug({ freezeBossAi: freeze }); }
