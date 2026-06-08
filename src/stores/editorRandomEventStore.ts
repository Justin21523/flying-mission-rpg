import { create } from 'zustand';

// Editable config for the random IncidentDirector + nearby-NPC reactions (🚨 Incidents tab).
// localStorage-backed, auto-persist. Per-incident enable/weight default to {enabled:true, weight:1}
// so newly-authored incidents are included without extra setup.

export type ReactionMode = 'watch' | 'approach' | 'flee';

export interface IncidentCfg { enabled: boolean; weight: number }
export interface ReactionCfg { enabled: boolean; radius: number; mode: ReactionMode }

interface EditorRandomEventState {
  enabled: boolean;        // director on/off
  intervalSec: number;     // seconds between spawn attempts
  maxConcurrent: number;   // cap on simultaneously-active incidents
  incidents: Record<string, IncidentCfg>;
  reaction: ReactionCfg;
  setEnabled: (b: boolean) => void;
  setIntervalSec: (n: number) => void;
  setMaxConcurrent: (n: number) => void;
  setIncidentCfg: (id: string, patch: Partial<IncidentCfg>) => void;
  setReaction: (patch: Partial<ReactionCfg>) => void;
  importState: (data: Partial<typeof DEFAULTS>) => void;
  reset: () => void;
}

const STORAGE_KEY = 'r3f-rpg-builder-poli-randomevent-v1';
const DEFAULTS = {
  enabled: false,
  intervalSec: 12,
  maxConcurrent: 2,
  incidents: {} as Record<string, IncidentCfg>,
  reaction: { enabled: true, radius: 6, mode: 'approach' as ReactionMode },
};

function persist(s: Pick<EditorRandomEventState, 'enabled' | 'intervalSec' | 'maxConcurrent' | 'incidents' | 'reaction'>): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}
function load(): typeof DEFAULTS {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULTS, ...(JSON.parse(raw) as object) };
  } catch { /* ignore */ }
  return { ...DEFAULTS };
}

export const useEditorRandomEventStore = create<EditorRandomEventState>((set, get) => ({
  ...load(),
  setEnabled: (b) => { set({ enabled: b }); persist(get()); },
  setIntervalSec: (n) => { set({ intervalSec: Math.max(1, n) }); persist(get()); },
  setMaxConcurrent: (n) => { set({ maxConcurrent: Math.max(1, Math.round(n)) }); persist(get()); },
  setIncidentCfg: (id, patch) => {
    const cur = get().incidents[id] ?? { enabled: true, weight: 1 };
    const incidents = { ...get().incidents, [id]: { ...cur, ...patch } };
    set({ incidents }); persist(get());
  },
  setReaction: (patch) => { set({ reaction: { ...get().reaction, ...patch } }); persist(get()); },
  importState: (data) => { set({ ...DEFAULTS, ...data }); persist(get()); },
  reset: () => { set({ ...DEFAULTS }); persist(get()); },
}));

// Per-incident config with sensible default (enabled, weight 1).
export function incidentCfg(id: string): IncidentCfg {
  return useEditorRandomEventStore.getState().incidents[id] ?? { enabled: true, weight: 1 };
}
