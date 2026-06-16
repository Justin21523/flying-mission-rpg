import type { SupportCombatAbilityDefinition, SupportCombatRuntimeState } from '../../types/game/supportCombat';
import { liveTargets, useCombatTargetStore } from '../../stores/game/combatTargetStore';
import { useCombatStore } from '../../stores/game/useCombatStore';
import { useSupportCombatStore } from '../../stores/game/useSupportCombatStore';
import { getSupportAbility, getSupportAbilitiesForCharacter } from '../../stores/game/useSupportCombatEditorStore';
import { getSupportCombatProfile } from '../../data/support-combat/supportCombatProfiles';
import { MVP_SUPPORT_CHARACTER_IDS } from '../../data/support-combat/supportCombatAbilities';
import { damageTargetByTemplate, activeCombatantId } from '../combat/CombatDirector';
import { playEffect } from '../combat/effects/CombatEffectDirector';
import { robotHandle } from '../destination/robotHandle';
import * as ObstacleDirector from '../obstacles/ObstacleDirector';
import * as ThreatController from './SupportThreatController';
import { getSupportPresence, classifyAbility } from './SupportPresenceAdapter';
import { resolveTargets } from './SupportTargetingResolver';
import { executeAbility, type SupportAbilityDeps, type SupportAbilityOutcome } from './SupportAbilityRuntime';
import { recordSupportOutcome, addProtectedAreaSeconds } from './SupportZoneConditionAdapter';
import { tryTriggerSynergy, resetSynergyCooldowns } from './SupportSynergyController';
import { accrueSyncFromAction } from './PartnerFusionDirector';

// Top-level orchestrator for support COMBAT (Batch E). Registers support characters for the active zone,
// reports ability availability (presence + cooldown + cost), and casts abilities — routing every effect
// through the existing combat/obstacle/zone seams via SupportAbilityRuntime. Never re-implements damage.

const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
export const PROTECT_AREA_ID = 'support_protect';

export interface SupportAvailabilityView {
  ability: SupportCombatAbilityDefinition;
  usable: boolean;
  reason?: string;
  downgraded?: boolean;
  cooldownRemainingMs: number;
  supportEnergy: number;
  cost: number;
}

export interface SupportCastResult {
  ok: boolean;
  reason?: string;
  abilityId: string;
  outcome?: SupportAbilityOutcome;
}

function defaultRuntime(characterId: string): SupportCombatRuntimeState {
  const profile = getSupportCombatProfile(characterId);
  return {
    supportCharacterId: characterId,
    currentStatus: 'available',
    activeAbilityIds: profile?.abilityIds ?? [],
    abilityCooldowns: {},
    supportEnergy: profile?.maxSupportEnergy ?? 100,
    maxSupportEnergy: profile?.maxSupportEnergy ?? 100,
    chargesByAbilityId: {},
  };
}

export function registerSupportCharacter(characterId: string): void {
  const store = useSupportCombatStore.getState();
  if (store.runtimeBySupportCharacterId[characterId]) return;
  const rt = defaultRuntime(characterId);
  store.setRuntimeState(characterId, rt);
  store.setSupportEnergy(characterId, rt.supportEnergy);
}

export function unregisterSupportCharacter(characterId: string): void {
  const store = useSupportCombatStore.getState();
  const next = { ...store.runtimeBySupportCharacterId };
  delete next[characterId];
  useSupportCombatStore.setState({ runtimeBySupportCharacterId: next });
}

export function initializeForZone(): void {
  for (const cid of MVP_SUPPORT_CHARACTER_IDS) registerSupportCharacter(cid);
}

export function getAvailableSupportAbilities(characterId: string): SupportAvailabilityView[] {
  const store = useSupportCombatStore.getState();
  const presence = getSupportPresence(characterId);
  const runtime = store.runtimeBySupportCharacterId[characterId];
  const t = nowMs();
  return getSupportAbilitiesForCharacter(characterId).map((ability) => {
    const forced = store.debug.forceAllSupportAvailable || !!ability.debug?.forceAvailable;
    const avail = classifyAbility(ability, presence, forced);
    const cdEnd = runtime?.abilityCooldowns[ability.id] ?? 0;
    const cooldownRemainingMs = Math.max(0, cdEnd - t);
    const onCooldown = !store.debug.ignoreSupportCooldown && !ability.debug?.ignoreCooldown && cooldownRemainingMs > 0;
    const cost = ability.resourceCost.supportEnergy ?? 0;
    const energy = runtime?.supportEnergy ?? 0;
    const hasEnergy = forced || store.debug.ignoreSupportCost || ability.debug?.ignoreCost || energy >= cost;
    const usable = (avail.usable || forced) && !onCooldown && hasEnergy;
    return {
      ability,
      usable,
      reason: !avail.usable ? avail.reason : onCooldown ? 'cooldown' : !hasEnergy ? 'low energy' : undefined,
      downgraded: avail.downgraded,
      cooldownRemainingMs,
      supportEnergy: energy,
      cost,
    };
  });
}

function buildDeps(t: number): SupportAbilityDeps {
  return {
    nowMs: t,
    damageTarget: (id, tpl) => damageTargetByTemplate(id, tpl),
    repairObstacle: (oid, amt) => ObstacleDirector.repair(oid, amt),
    getTarget: (id) => liveTargets.find((x) => x.id === id),
    markScanned: (id) => { const x = liveTargets.find((c) => c.id === id); if (x) { x.scanned = true; x.weakpointExposed = true; } },
    stunTarget: (id, sec) => { const x = liveTargets.find((c) => c.id === id); if (x) (x.aiData ??= {}).stunUntil = t / 1000 + sec; },
    bumpTargets: () => useCombatTargetStore.getState().bump(),
    applyTaunt: (ids, center, sec, hp, model) => ThreatController.applyTaunt(ids, center, sec, hp, model),
    addActiveEffect: (eff) => useSupportCombatStore.getState().addActiveSupportEffect(eff),
    healPlayer: (amt) => {
      const id = activeCombatantId();
      if (!id || amt <= 0) return;
      const cs = useCombatStore.getState();
      const st = cs.playerStatsByCharacterId[id];
      if (st) cs.updateCombatStats(id, { hp: Math.min(st.maxHp, st.hp + amt) });
    },
    playVisual: (defId, x, y, z, h) => playEffect(defId, { skillInstanceId: `support_${defId}`, x, y, z, headingRad: h }),
  };
}

export function castSupportAbility(abilityId: string, opts: { manualTargetId?: string } = {}): SupportCastResult {
  const ability = getSupportAbility(abilityId);
  if (!ability) return { ok: false, reason: 'unknown ability', abilityId };
  const charId = ability.supportCharacterId;
  registerSupportCharacter(charId);
  const store = useSupportCombatStore.getState();
  const runtime = store.runtimeBySupportCharacterId[charId]!;
  const t = nowMs();

  const forced = store.debug.forceAllSupportAvailable || !!ability.debug?.forceAvailable;
  const presence = getSupportPresence(charId);
  const avail = classifyAbility(ability, presence, forced);
  if (!avail.usable && !forced) return { ok: false, reason: avail.reason ?? 'unavailable', abilityId };

  const ignoreCd = store.debug.ignoreSupportCooldown || ability.debug?.ignoreCooldown || forced;
  if (!ignoreCd && (runtime.abilityCooldowns[abilityId] ?? 0) > t) return { ok: false, reason: 'cooldown', abilityId };

  const cost = ability.resourceCost.supportEnergy ?? 0;
  const ignoreCost = store.debug.ignoreSupportCost || ability.debug?.ignoreCost || forced;
  if (!ignoreCost && runtime.supportEnergy < cost) return { ok: false, reason: 'low energy', abilityId };

  // Resolve targets.
  const heading = robotHandle.heading;
  const tr = resolveTargets(ability.targeting, {
    playerX: robotHandle.pos.x, playerZ: robotHandle.pos.z, headingRad: heading,
    candidates: liveTargets, manualTargetId: opts.manualTargetId,
    validTargetTags: ability.validTargetTags, invalidTargetTags: ability.invalidTargetTags,
  });
  const needsTarget = ability.targeting.targetType !== 'player' && ability.targeting.targetType !== 'area';
  if (needsTarget && !tr.primaryId) return { ok: false, reason: 'no target in range', abilityId };

  // Execute.
  const outcome = executeAbility(ability, { ...tr, playerX: robotHandle.pos.x, playerZ: robotHandle.pos.z, headingRad: heading }, buildDeps(t));

  // Pay cost + cooldown + runtime bookkeeping.
  if (!ignoreCost) store.setSupportEnergy(charId, Math.max(0, runtime.supportEnergy - cost));
  if (!ignoreCd) store.startSupportCooldown(charId, abilityId, t + ability.cooldownSeconds * 1000);
  store.updateSupportRuntimeState(charId, { lastUsedAbilityId: abilityId, lastUsedAt: t, currentTargetId: tr.primaryId });

  // Zone progress + synergy.
  recordSupportOutcome({
    abilityId,
    primaryTargetId: tr.primaryId,
    repairedDeviceIds: outcome.repairedDeviceIds,
    clearedObstacleIds: outcome.clearedObstacleIds,
    scannedTargetIds: outcome.scannedTargetIds,
  });
  tryTriggerSynergy({
    nowMs: t,
    lastSupportAbilityId: abilityId,
    scannedEnemy: outcome.scannedTargetIds.length > 0,
    primaryRecentSkillTags: [],
  });
  accrueSyncFromAction(16); // Batch I — support use fills the partner-fusion sync gauge faster than skills

  return { ok: true, abilityId, outcome };
}

// Per-frame tick: support-energy regen, active-effect expiry + protected-area accrual, decoy expiry.
export function update(dt: number): void {
  const store = useSupportCombatStore.getState();
  const t = nowMs();

  for (const rt of Object.values(store.runtimeBySupportCharacterId)) {
    const profile = getSupportCombatProfile(rt.supportCharacterId);
    const regen = (profile?.supportEnergyRegenPerSecond ?? 4) * dt;
    if (rt.supportEnergy < rt.maxSupportEnergy) {
      store.setSupportEnergy(rt.supportCharacterId, Math.min(rt.maxSupportEnergy, rt.supportEnergy + regen));
    }
  }

  let shieldActive = false;
  for (const eff of Object.values(store.activeSupportEffects)) {
    if (eff.untilMs <= t) { store.removeActiveSupportEffect(eff.id); continue; }
    if (eff.effectType === 'shield') shieldActive = true;
  }
  if (shieldActive) addProtectedAreaSeconds(PROTECT_AREA_ID, dt);

  ThreatController.clearExpired(t / 1000);
}

export function cleanup(): void {
  ThreatController.reset();
  resetSynergyCooldowns();
  useSupportCombatStore.getState().resetSupportCombat();
}
