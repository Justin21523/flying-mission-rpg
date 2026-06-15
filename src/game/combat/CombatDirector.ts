import { useCombatStore } from '../../stores/game/useCombatStore';
import { useCombatTargetStore, liveTargets } from '../../stores/game/combatTargetStore';
import { useCharacterStore } from '../../stores/game/useCharacterStore';
import { useSupportRuntimeStore } from '../../stores/game/supportRuntimeStore';
import { getCombatSkill, getDamageable, getCombatStatsPreset } from '../../stores/game/editorCombatStore';
import { statsFromPreset, type DamageEvent } from '../../types/game/combat';
import { robotHandle } from '../destination/robotHandle';
import { castSkill, type SkillCaster, type SkillCastDeps, type SkillCastOutcome } from './SkillRuntime';
import { regenEnergy } from './EnergyManager';
import { regenShield, applyPlayerDamage } from './ShieldManager';
import { resolveDamage } from './DamageResolver';
import { playEffect, cleanupExpired } from './effects/CombatEffectDirector';

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
  useCombatStore.getState().resetCombat();
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
    getTargets: () => liveTargets.filter((t) => !t.defeatedAt).map((t) => ({ id: t.id, x: t.x, y: t.y, z: t.z, definitionId: t.definitionId })),
    getDamageable: (defId) => getDamageable(defId),
    getVitals: (targetId) => { const t = liveTargets.find((x) => x.id === targetId); return t ? { hp: t.hp, shield: t.shield } : undefined; },
    applyResult: (result) => useCombatTargetStore.getState().applyResult(result),
    pushDamageResult: (result) => useCombatStore.getState().pushDamageResult(result),
    playEffect: (effectDefId, skillInstanceId, caster) => playEffect(effectDefId, { skillInstanceId, x: caster.x, y: caster.y, z: caster.z, headingRad: caster.headingRad }),
  };
}

export function castSkillById(skillId: string, casterId?: string): SkillCastOutcome | null {
  const skill = getCombatSkill(skillId);
  if (!skill) return null;
  const characterId = casterId ?? activeCombatantId();
  if (!characterId) return null;
  const caster: SkillCaster = { characterId, x: robotHandle.pos.x, y: robotHandle.pos.y, z: robotHandle.pos.z, headingRad: robotHandle.heading };
  return castSkill(skill, caster, makeDeps());
}

// Apply incoming damage to the player (debug / future enemy attacks). Dummies go through applyResult.
export function applyDamageToPlayer(amount: number, characterId?: string): void {
  const id = characterId ?? activeCombatantId();
  if (!id) return;
  const cs = useCombatStore.getState();
  const stats = cs.playerStatsByCharacterId[id];
  if (!stats || cs.godMode || stats.invulnerable) return;
  const next = applyPlayerDamage(stats, amount);
  lastShieldDamageMs[id] = nowMs();
  cs.updateCombatStats(id, { hp: next.hp, shield: next.shield, downed: next.hp <= 0 });
}

// Debug: apply a damage event directly to a live dummy target (no hit volume).
export function applyDamageToTarget(event: DamageEvent): void {
  const t = liveTargets.find((x) => x.id === event.targetId);
  if (!t) return;
  const def = getDamageable(t.definitionId);
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
  useCombatTargetStore.getState().removeDead();
}
