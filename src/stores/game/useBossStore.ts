import { create } from 'zustand';
import type { BossRuntimeState } from '../../types/game/boss';

// Runtime state for the active boss encounter (Batch F). One boss at a time. The BossDirector writes; UI
// reads. `version` is bumped on in-place mutations (hp/shield ticked from the boss CombatTarget) so the HUD
// re-reads without per-frame store churn.
interface BossStoreState {
  runtime: BossRuntimeState | null;
  version: number;

  setRuntime: (runtime: BossRuntimeState | null) => void;
  patchRuntime: (patch: Partial<BossRuntimeState>) => void;
  setActivePhase: (phaseId: string) => void;
  markPhaseComplete: (phaseId: string) => void;
  recordWeakpointDestroyed: (weakpointId: string) => void;
  recordWaveCleared: (waveId: string) => void;
  setStatus: (status: BossRuntimeState['status']) => void;
  setDebug: (patch: Partial<NonNullable<BossRuntimeState['debug']>>) => void;
  bump: () => void;
  reset: () => void;
}

export const useBossStore = create<BossStoreState>((set, get) => ({
  runtime: null,
  version: 0,

  setRuntime: (runtime) => set({ runtime, version: get().version + 1 }),
  patchRuntime: (patch) => set((s) => (s.runtime ? { runtime: { ...s.runtime, ...patch }, version: s.version + 1 } : s)),

  setActivePhase: (phaseId) => set((s) => (s.runtime ? { runtime: { ...s.runtime, activePhaseId: phaseId, status: 'active' }, version: s.version + 1 } : s)),

  markPhaseComplete: (phaseId) =>
    set((s) => {
      if (!s.runtime) return s;
      const completed = s.runtime.completedPhaseIds.includes(phaseId) ? s.runtime.completedPhaseIds : [...s.runtime.completedPhaseIds, phaseId];
      return { runtime: { ...s.runtime, completedPhaseIds: completed }, version: s.version + 1 };
    }),

  recordWeakpointDestroyed: (weakpointId) =>
    set((s) => {
      if (!s.runtime) return s;
      const destroyed = s.runtime.destroyedWeakpointIds.includes(weakpointId) ? s.runtime.destroyedWeakpointIds : [...s.runtime.destroyedWeakpointIds, weakpointId];
      const active = s.runtime.activeWeakpointIds.filter((w) => w !== weakpointId);
      return { runtime: { ...s.runtime, destroyedWeakpointIds: destroyed, activeWeakpointIds: active }, version: s.version + 1 };
    }),

  recordWaveCleared: (waveId) =>
    set((s) => {
      if (!s.runtime) return s;
      const cleared = s.runtime.clearedSummonWaveIds.includes(waveId) ? s.runtime.clearedSummonWaveIds : [...s.runtime.clearedSummonWaveIds, waveId];
      return { runtime: { ...s.runtime, clearedSummonWaveIds: cleared }, version: s.version + 1 };
    }),

  setStatus: (status) => set((s) => (s.runtime ? { runtime: { ...s.runtime, status }, version: s.version + 1 } : s)),

  setDebug: (patch) =>
    set((s) => (s.runtime ? { runtime: { ...s.runtime, debug: { godMode: false, freezeBossAi: false, ...s.runtime.debug, ...patch } }, version: s.version + 1 } : s)),

  bump: () => set((s) => ({ version: s.version + 1 })),
  reset: () => set({ runtime: null, version: get().version + 1 }),
}));
