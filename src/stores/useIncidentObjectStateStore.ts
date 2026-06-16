import { create } from 'zustand';

// Incident-owned virtual object states (Batch G). Generic "objects" referenced by an IncidentPlan that aren't
// real obstacles/devices (e.g. a stalled vehicle, a danger-zone area marker). Mutated only by
// IncidentObjectStateController.
export type IncidentObjectState = 'normal' | 'damaged' | 'blocking-path' | 'burning' | 'flooded' | 'broken' | 'repaired' | 'disabled' | 'active' | 'cleared';

export interface IncidentObjectRuntime {
  id: string;
  state: IncidentObjectState;
  position: [number, number, number];
}

interface IncidentObjectStateStore {
  objects: Record<string, IncidentObjectRuntime>;
  setObject: (id: string, patch: Partial<IncidentObjectRuntime>) => void;
  removeObject: (id: string) => void;
  clearAll: () => void;
}

export const useIncidentObjectStateStore = create<IncidentObjectStateStore>((set) => ({
  objects: {},
  setObject: (id, patch) => set((s) => {
    const base: IncidentObjectRuntime = s.objects[id] ?? { id, state: 'normal', position: [0, 0, 0] };
    return { objects: { ...s.objects, [id]: { ...base, ...patch, id } } };
  }),
  removeObject: (id) => set((s) => { const o = { ...s.objects }; delete o[id]; return { objects: o }; }),
  clearAll: () => set({ objects: {} }),
}));

export function getIncidentObjectState(id: string): IncidentObjectState | undefined {
  return useIncidentObjectStateStore.getState().objects[id]?.state;
}
