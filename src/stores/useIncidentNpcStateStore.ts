import { create } from 'zustand';

// Incident-owned virtual NPC rescue states (Batch G). The base game has no rescue/panic/safe state, so the
// incident system tracks its rescue subjects here (rendered as scene markers). Mutated only by
// IncidentNPCStateController; React reads it.
export type IncidentNpcState = 'idle' | 'trapped' | 'panicked' | 'injured' | 'waiting-rescue' | 'evacuating' | 'safe';

export interface IncidentNpcRuntime {
  id: string;
  state: IncidentNpcState;
  position: [number, number, number];
  dialogueHint?: string;
  // Batch H — behavior runtime (movement/panic). Driven by IncidentNpcBehaviorController.
  targetAreaId?: string;
  panicAccum?: number;
  facingRad?: number;
}

interface IncidentNpcStateStore {
  npcs: Record<string, IncidentNpcRuntime>;
  setNpc: (id: string, patch: Partial<IncidentNpcRuntime>) => void;
  removeNpc: (id: string) => void;
  clearAll: () => void;
}

export const useIncidentNpcStateStore = create<IncidentNpcStateStore>((set) => ({
  npcs: {},
  setNpc: (id, patch) => set((s) => {
    const base: IncidentNpcRuntime = s.npcs[id] ?? { id, state: 'idle', position: [0, 0, 0] };
    return { npcs: { ...s.npcs, [id]: { ...base, ...patch, id } } };
  }),
  removeNpc: (id) => set((s) => { const n = { ...s.npcs }; delete n[id]; return { npcs: n }; }),
  clearAll: () => set({ npcs: {} }),
}));

export function getIncidentNpcState(id: string): IncidentNpcState | undefined {
  return useIncidentNpcStateStore.getState().npcs[id]?.state;
}
