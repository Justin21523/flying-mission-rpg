import { create } from 'zustand';
import type { SupportCombatRuntimeState, ActiveSupportEffectState } from '../../types/game/supportCombat';

// Runtime state for support COMBAT (Batch E). Separate from the dispatch store (supportRuntimeStore) — this
// tracks per-support-character combat readiness (cooldowns, support energy, charges), the player's current
// support selection/target, live shield/decoy effects, and synergy state. UI reads; only the support-combat
// director/runtime writes (abilities never write this directly from a component).

export interface SupportCombatDebugFlags {
  forceAllSupportAvailable: boolean;
  ignoreSupportCooldown: boolean;
  ignoreSupportCost: boolean;
  showSupportTargeting: boolean;
}

export interface SupportSynergyState {
  activeSynergyIds: string[];
  lastTriggeredSynergyId?: string;
  lastTriggeredAtMs?: number;
}

interface SupportCombatStoreState {
  runtimeBySupportCharacterId: Record<string, SupportCombatRuntimeState>;

  selectedSupportCharacterId?: string;
  selectedSupportAbilityId?: string;
  selectedSupportTargetId?: string;

  supportEnergyByCharacterId: Record<string, number>;

  activeSupportEffects: Record<string, ActiveSupportEffectState>;

  synergyState: SupportSynergyState;

  debug: SupportCombatDebugFlags;

  version: number; // bumped on non-React-tracked mutations (effects ticked in place) so HUD can re-read

  // ---- actions ----
  selectSupportCharacter: (characterId: string | undefined) => void;
  selectSupportAbility: (abilityId: string | undefined) => void;
  setSupportTarget: (targetId: string | undefined) => void;

  setRuntimeState: (characterId: string, state: SupportCombatRuntimeState) => void;
  updateSupportRuntimeState: (characterId: string, patch: Partial<SupportCombatRuntimeState>) => void;
  startSupportCooldown: (characterId: string, abilityId: string, untilMs: number) => void;
  setSupportEnergy: (characterId: string, energy: number) => void;

  addActiveSupportEffect: (effect: ActiveSupportEffectState) => void;
  removeActiveSupportEffect: (effectId: string) => void;

  setSynergyTriggered: (synergyId: string, nowMs: number) => void;

  setDebugFlag: (flag: keyof SupportCombatDebugFlags, value: boolean) => void;
  bump: () => void;
  resetSupportCombat: () => void;
}

// Max active shield damage-reduction fraction (0..1) currently protecting the player. Read by
// CombatDirector.applyDamageToPlayer so Shield Support actually reduces incoming damage.
export function activeSupportShieldReduction(): number {
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  let red = 0;
  for (const e of Object.values(useSupportCombatStore.getState().activeSupportEffects)) {
    if (e.effectType === 'shield' && e.untilMs > now) red = Math.max(red, Math.min(1, e.amount ?? 0));
  }
  return red;
}

const INITIAL_DEBUG: SupportCombatDebugFlags = {
  forceAllSupportAvailable: false,
  ignoreSupportCooldown: false,
  ignoreSupportCost: false,
  showSupportTargeting: false,
};

export const useSupportCombatStore = create<SupportCombatStoreState>((set, get) => ({
  runtimeBySupportCharacterId: {},
  supportEnergyByCharacterId: {},
  activeSupportEffects: {},
  synergyState: { activeSynergyIds: [] },
  debug: { ...INITIAL_DEBUG },
  version: 0,

  selectSupportCharacter: (selectedSupportCharacterId) => set({ selectedSupportCharacterId }),
  selectSupportAbility: (selectedSupportAbilityId) => set({ selectedSupportAbilityId }),
  setSupportTarget: (selectedSupportTargetId) => set({ selectedSupportTargetId }),

  setRuntimeState: (characterId, state) =>
    set((s) => ({ runtimeBySupportCharacterId: { ...s.runtimeBySupportCharacterId, [characterId]: state } })),

  updateSupportRuntimeState: (characterId, patch) =>
    set((s) => {
      const prev = s.runtimeBySupportCharacterId[characterId];
      if (!prev) return s;
      return { runtimeBySupportCharacterId: { ...s.runtimeBySupportCharacterId, [characterId]: { ...prev, ...patch } } };
    }),

  startSupportCooldown: (characterId, abilityId, untilMs) =>
    set((s) => {
      const prev = s.runtimeBySupportCharacterId[characterId];
      if (!prev) return s;
      return {
        runtimeBySupportCharacterId: {
          ...s.runtimeBySupportCharacterId,
          [characterId]: { ...prev, abilityCooldowns: { ...prev.abilityCooldowns, [abilityId]: untilMs } },
        },
      };
    }),

  setSupportEnergy: (characterId, energy) =>
    set((s) => ({
      supportEnergyByCharacterId: { ...s.supportEnergyByCharacterId, [characterId]: energy },
      runtimeBySupportCharacterId: s.runtimeBySupportCharacterId[characterId]
        ? { ...s.runtimeBySupportCharacterId, [characterId]: { ...s.runtimeBySupportCharacterId[characterId], supportEnergy: energy } }
        : s.runtimeBySupportCharacterId,
    })),

  addActiveSupportEffect: (effect) =>
    set((s) => ({ activeSupportEffects: { ...s.activeSupportEffects, [effect.id]: effect }, version: s.version + 1 })),

  removeActiveSupportEffect: (effectId) =>
    set((s) => {
      if (!s.activeSupportEffects[effectId]) return s;
      const next = { ...s.activeSupportEffects };
      delete next[effectId];
      return { activeSupportEffects: next, version: s.version + 1 };
    }),

  setSynergyTriggered: (synergyId, nowMs) =>
    set((s) => ({
      synergyState: {
        activeSynergyIds: s.synergyState.activeSynergyIds.includes(synergyId) ? s.synergyState.activeSynergyIds : [...s.synergyState.activeSynergyIds, synergyId],
        lastTriggeredSynergyId: synergyId,
        lastTriggeredAtMs: nowMs,
      },
    })),

  setDebugFlag: (flag, value) => set((s) => ({ debug: { ...s.debug, [flag]: value } })),

  bump: () => set((s) => ({ version: s.version + 1 })),

  resetSupportCombat: () =>
    set({
      runtimeBySupportCharacterId: {},
      supportEnergyByCharacterId: {},
      activeSupportEffects: {},
      synergyState: { activeSynergyIds: [] },
      selectedSupportCharacterId: undefined,
      selectedSupportAbilityId: undefined,
      selectedSupportTargetId: undefined,
      debug: { ...INITIAL_DEBUG },
      version: get().version + 1,
    }),
}));
