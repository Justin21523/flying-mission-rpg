import { create } from 'zustand';

// Incident environment hazard PLACEHOLDERS (Batch G). Smoke/fire/flood/electric/danger-zone/route-block are
// simple visual+gameplay placeholders (no real physics). Mutated only by IncidentEnvironmentStateController;
// rendered by IncidentEnvironmentHazardRenderer.
export type IncidentHazardKind = 'smoke' | 'fire' | 'flood' | 'electric' | 'danger-zone' | 'route-block' | 'route-open';

export interface IncidentHazard {
  id: string;
  kind: IncidentHazardKind;
  areaId: string;
  center: [number, number, number];
  radius: number;
  active: boolean;
}

interface IncidentHazardStore {
  hazards: Record<string, IncidentHazard>;
  setHazard: (id: string, patch: Partial<IncidentHazard> & Pick<IncidentHazard, 'kind' | 'areaId' | 'center'>) => void;
  setActive: (id: string, active: boolean) => void;
  removeHazard: (id: string) => void;
  clearAll: () => void;
}

export const useIncidentHazardStore = create<IncidentHazardStore>((set) => ({
  hazards: {},
  setHazard: (id, patch) => set((s) => {
    const base: IncidentHazard = s.hazards[id] ?? { id, kind: patch.kind, areaId: patch.areaId, center: patch.center, radius: 8, active: true };
    return { hazards: { ...s.hazards, [id]: { ...base, ...patch, id } } };
  }),
  setActive: (id, active) => set((s) => (s.hazards[id] ? { hazards: { ...s.hazards, [id]: { ...s.hazards[id], active } } } : s)),
  removeHazard: (id) => set((s) => { const h = { ...s.hazards }; delete h[id]; return { hazards: h }; }),
  clearAll: () => set({ hazards: {} }),
}));

export function activeHazardCount(): number {
  return Object.values(useIncidentHazardStore.getState().hazards).filter((h) => h.active).length;
}
