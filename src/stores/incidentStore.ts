import { create } from 'zustand';
import { getEditorIncidents } from './editorIncidentStore';
import { useFlagStore } from './flagStore';
import type { IncidentDefinition } from '../types/incident';

// Runtime incident state. Incidents now appear only when SPAWNED by the IncidentDirector (random),
// not always-on. `activeIds` is the set of currently-spawned incidents; definitions come from the
// editable editorIncidentStore. Resolution is recorded in flagStore (incident_resolved_{id}).
interface IncidentState {
  activeIds: string[];
  spawn: (id: string) => void;
  clear: (id: string) => void;
  isResolved: (defId: string) => boolean;
  resolveIncident: (defId: string) => void;
  getActiveForArea: (areaId: string) => IncidentDefinition[];
}

export const useIncidentStore = create<IncidentState>((set, get) => ({
  activeIds: [],
  spawn: (id) => { if (!get().activeIds.includes(id)) set({ activeIds: [...get().activeIds, id] }); },
  clear: (id) => set({ activeIds: get().activeIds.filter((x) => x !== id) }),
  isResolved: (defId) => useFlagStore.getState().hasFlag(`incident_resolved_${defId}`),
  resolveIncident: (defId) => {
    useFlagStore.getState().setFlag(`incident_resolved_${defId}`);
    set({ activeIds: get().activeIds.filter((x) => x !== defId) });
  },
  getActiveForArea: (areaId) => {
    const active = get().activeIds;
    return getEditorIncidents().filter(
      (d) => active.includes(d.id) && d.spawnAreaId === areaId
        && !useFlagStore.getState().hasFlag(`incident_resolved_${d.id}`),
    );
  },
}));
