import { create } from 'zustand';
import type { IncidentScenarioDefinition } from '../types/trafficIncident';
import { TRAFFIC_SCENARIO_SEED } from '../data/poli/trafficScenarioSeed';

// POLI (Phase F) — authoring data for the Traffic Incident Director: scenario definitions + the director config
// (on/off, attempt interval, global concurrent cap). Auto-persisted; round-trips via the content registry
// (domain 'editorTrafficScenario') and Undo. Deep timeline edits go through the JSON strip; the UI exposes the
// top-level fields + per-scenario enable/weight + ▶ trigger.
interface DirectorCfg { enabled: boolean; intervalSec: number; maxConcurrent: number }

interface EditorTrafficScenarioState extends DirectorCfg {
  scenarios: IncidentScenarioDefinition[];
  setDirector: (patch: Partial<DirectorCfg>) => void;
  addScenario: () => string;
  updateScenario: (id: string, patch: Partial<IncidentScenarioDefinition>) => void;
  removeScenario: (id: string) => void;
  mergeMissingFromSeed: () => void;
  importState: (data: { scenarios?: IncidentScenarioDefinition[]; enabled?: boolean; intervalSec?: number; maxConcurrent?: number }) => void;
  reset: () => void;
}

const STORAGE_KEY = 'r3f-rpg-builder-poli-trafficscenario-v1';
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const uid = () => `scn_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
const DIRECTOR_DEFAULTS: DirectorCfg = { enabled: false, intervalSec: 20, maxConcurrent: 1 };

type Persisted = DirectorCfg & { scenarios: IncidentScenarioDefinition[] };
function persist(s: Persisted): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}
function load(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (Array.isArray(p.scenarios)) return { ...DIRECTOR_DEFAULTS, ...p, scenarios: p.scenarios };
    }
  } catch { /* ignore */ }
  return { ...DIRECTOR_DEFAULTS, scenarios: clone(TRAFFIC_SCENARIO_SEED) };
}

export const useEditorTrafficScenarioStore = create<EditorTrafficScenarioState>((set, get) => {
  const save = () => { const s = get(); persist({ enabled: s.enabled, intervalSec: s.intervalSec, maxConcurrent: s.maxConcurrent, scenarios: s.scenarios }); };
  return {
    ...load(),
    setDirector: (patch) => { set(patch); save(); },
    addScenario: () => {
      const id = uid();
      const scn: IncidentScenarioDefinition = {
        id, name: 'New Scenario', enabled: true, category: 'custom', severity: 1,
        requiredLocationTags: [], minParticipants: 1, maxParticipants: 1,
        cooldown: 30, globalCooldown: 10, maxConcurrentInstances: 1, triggerMode: 'randomWeighted', weight: 1,
        setupActions: [{ type: 'spawnVehicle' }, { type: 'blockRoad', pathId: '', partial: true }],
        timeline: [], resolutionConditions: [{ type: 'playerReached', radius: 4 }, { type: 'timeout', seconds: 60 }],
        cleanupActions: [],
      };
      set({ scenarios: [...get().scenarios, scn] }); save();
      return id;
    },
    updateScenario: (id, patch) => { set({ scenarios: get().scenarios.map((d) => (d.id === id ? { ...d, ...patch } : d)) }); save(); },
    removeScenario: (id) => { set({ scenarios: get().scenarios.filter((d) => d.id !== id) }); save(); },
    mergeMissingFromSeed: () => {
      const have = new Set(get().scenarios.map((d) => d.id));
      const add = TRAFFIC_SCENARIO_SEED.filter((s) => !have.has(s.id));
      if (add.length) { set({ scenarios: [...get().scenarios, ...clone(add)] }); save(); }
    },
    importState: (data) => {
      set({
        scenarios: Array.isArray(data.scenarios) ? data.scenarios : get().scenarios,
        enabled: data.enabled ?? get().enabled,
        intervalSec: data.intervalSec ?? get().intervalSec,
        maxConcurrent: data.maxConcurrent ?? get().maxConcurrent,
      });
      save();
    },
    reset: () => { set({ ...DIRECTOR_DEFAULTS, scenarios: clone(TRAFFIC_SCENARIO_SEED) }); save(); },
  };
});

export function getScenarios(): IncidentScenarioDefinition[] { return useEditorTrafficScenarioStore.getState().scenarios; }
export function getScenarioDirectorCfg(): DirectorCfg {
  const s = useEditorTrafficScenarioStore.getState();
  return { enabled: s.enabled, intervalSec: s.intervalSec, maxConcurrent: s.maxConcurrent };
}
