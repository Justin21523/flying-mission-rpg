import { create } from 'zustand';
import { POLI_INCIDENTS } from '../data/incidents/broomsTownIncidents';
import { useFlagStore } from './flagStore';
import type { IncidentDefinition } from '../types/incident';

interface IncidentState {
  getActiveForArea: (areaId: string) => IncidentDefinition[];
  isResolved: (defId: string) => boolean;
  resolveIncident: (defId: string) => void;
}

export const useIncidentStore = create<IncidentState>(() => ({
  getActiveForArea: (areaId) =>
    POLI_INCIDENTS.filter(
      (d) =>
        d.spawnAreaId === areaId &&
        !useFlagStore.getState().hasFlag(`incident_resolved_${d.id}`),
    ),
  isResolved: (defId) => useFlagStore.getState().hasFlag(`incident_resolved_${defId}`),
  resolveIncident: (defId) =>
    useFlagStore.getState().setFlag(`incident_resolved_${defId}`),
}));
