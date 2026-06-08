import { create } from 'zustand';
import { POLI_INCIDENTS } from '../data/incidents/broomsTownIncidents';
import type { IncidentDefinition, RescueStage } from '../types/incident';

// Editable incident definitions (🚨 Incidents tab). Seeded from POLI_INCIDENTS on first load so the
// built-in incidents are editable; new ones can be authored. Runtime reads getEditorIncidents().
// Mirrors editorActivityStore (per-id CRUD + nested stage ops, auto-persisted to localStorage).

interface EditorIncidentState {
  incidents: IncidentDefinition[];
  selectedId: string | null;
  addIncident: (areaId: string) => string;
  updateIncident: (id: string, patch: Partial<IncidentDefinition>) => void;
  removeIncident: (id: string) => void;
  duplicateIncident: (id: string) => void;
  selectIncident: (id: string | null) => void;
  // Nested edits operate on the SELECTED incident.
  addStage: () => void;
  updateStage: (index: number, patch: Partial<RescueStage>) => void;
  removeStage: (index: number) => void;
  addWaypoint: (stageIndex: number, pos: [number, number, number]) => void;
  updateWaypoint: (stageIndex: number, wpIndex: number, pos: [number, number, number]) => void;
  removeWaypoint: (stageIndex: number, wpIndex: number) => void;
  reset: () => void;
}

const STORAGE_KEY = 'r3f-rpg-builder-poli-incident-v1';

function clone<T>(v: T): T { return JSON.parse(JSON.stringify(v)) as T; }

function persist(incidents: IncidentDefinition[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ incidents })); } catch { /* ignore */ }
}

function load(): IncidentDefinition[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as { incidents?: IncidentDefinition[] };
      if (Array.isArray(p.incidents)) return p.incidents.filter((d) => d?.id);
    }
  } catch { /* ignore */ }
  return clone(POLI_INCIDENTS); // seed
}

const defaultStage = (n: number): RescueStage => ({
  id: `stage_${Date.now().toString(36)}_${n}`,
  type: 'action',
  title: 'New Stage',
  description: 'Press [E] rapidly!',
  actionCount: 8,
  timeLimitSeconds: 20,
  retryHint: 'Try again!',
});

export const useEditorIncidentStore = create<EditorIncidentState>((set, get) => {
  // Replace the selected incident via a producer fn, then persist.
  const mutate = (fn: (d: IncidentDefinition) => IncidentDefinition) => {
    const id = get().selectedId;
    if (!id) return;
    const incidents = get().incidents.map((d) => (d.id === id ? fn(d) : d));
    set({ incidents }); persist(incidents);
  };

  return {
    incidents: load(),
    selectedId: null,

    addIncident: (areaId) => {
      const id = `incident_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
      const def: IncidentDefinition = {
        id, type: 'fire', title: 'New Incident', description: 'Describe the incident.',
        spawnAreaId: areaId, markerPosition: [0, 1, 4],
        stages: [defaultStage(0)],
        safetyLesson: { title: 'Safety Tip', lesson: 'Stay safe and call for help.' },
        reward: { exp: 60, flags: [] },
        sourceConfidence: 'GameAdaptation',
      };
      const incidents = [...get().incidents, def];
      set({ incidents, selectedId: id }); persist(incidents);
      return id;
    },
    updateIncident: (id, patch) => {
      const incidents = get().incidents.map((d) => (d.id === id ? { ...d, ...patch } : d));
      set({ incidents }); persist(incidents);
    },
    removeIncident: (id) => {
      const incidents = get().incidents.filter((d) => d.id !== id);
      set({ incidents, selectedId: get().selectedId === id ? null : get().selectedId }); persist(incidents);
    },
    duplicateIncident: (id) => {
      const src = get().incidents.find((d) => d.id === id);
      if (!src) return;
      const nid = `incident_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
      const copy: IncidentDefinition = { ...clone(src), id: nid, title: `${src.title} (copy)` };
      const incidents = [...get().incidents, copy];
      set({ incidents, selectedId: nid }); persist(incidents);
    },
    selectIncident: (id) => set({ selectedId: id }),

    addStage: () => mutate((d) => ({ ...d, stages: [...d.stages, defaultStage(d.stages.length)] })),
    updateStage: (index, patch) => mutate((d) => ({ ...d, stages: d.stages.map((s, i) => (i === index ? { ...s, ...patch } : s)) })),
    removeStage: (index) => mutate((d) => ({ ...d, stages: d.stages.filter((_, i) => i !== index) })),
    addWaypoint: (si, pos) => mutate((d) => ({ ...d, stages: d.stages.map((s, i) => (i === si ? { ...s, waypointPositions: [...(s.waypointPositions ?? []), pos] } : s)) })),
    updateWaypoint: (si, wi, pos) => mutate((d) => ({ ...d, stages: d.stages.map((s, i) => (i === si ? { ...s, waypointPositions: (s.waypointPositions ?? []).map((w, j) => (j === wi ? pos : w)) } : s)) })),
    removeWaypoint: (si, wi) => mutate((d) => ({ ...d, stages: d.stages.map((s, i) => (i === si ? { ...s, waypointPositions: (s.waypointPositions ?? []).filter((_, j) => j !== wi) } : s)) })),

    reset: () => { const incidents = clone(POLI_INCIDENTS); set({ incidents, selectedId: null }); persist(incidents); },
  };
});

export function getEditorIncidents(): IncidentDefinition[] {
  return useEditorIncidentStore.getState().incidents;
}
export function getEditorIncident(id: string | null | undefined): IncidentDefinition | undefined {
  if (!id) return undefined;
  return useEditorIncidentStore.getState().incidents.find((d) => d.id === id);
}
