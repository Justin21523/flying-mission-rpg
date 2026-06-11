import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { moveItem } from '../../game/editor/arrayMove';
import { FLIGHT_CUE_TYPES, DEFAULT_FLIGHT_CUE } from '../../types/game/flightCue';
import type { FlightCue, FlightCueType } from '../../types/game/flightCue';

// Edit-Mode authored flight cue timelines, keyed by path id (the base fly-around loop + the world route each
// have their own list). localStorage-backed; registered for project export/import + Undo. Cues are sorted by
// atU on read so the runner + editor always see them in timeline order.
const STORAGE_KEY = 'aero-rescue-editor-flight-cues-v1';
type CueMap = Record<string, FlightCue[]>;

function persist(byPath: CueMap): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ byPath })); } catch { /* ignore */ }
}
function load(): CueMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) { const p = JSON.parse(raw); if (p && typeof p === 'object' && p.byPath) return p.byPath as CueMap; }
  } catch { /* ignore */ }
  return {};
}
const sortByU = (cues: FlightCue[]) => [...cues].sort((a, b) => a.atU - b.atU);

interface EditorFlightCueState {
  byPath: CueMap;
  add: (pathId: string, type: FlightCueType, atU: number) => string;
  update: (pathId: string, id: string, patch: Partial<FlightCue>) => void;
  remove: (pathId: string, id: string) => void;
  reorder: (pathId: string, id: string, dir: -1 | 1) => void;
  importState: (data: { byPath?: CueMap }) => void;
  reset: () => void;
}

export const useEditorFlightCueStore = create<EditorFlightCueState>((set, get) => ({
  byPath: load(),
  add: (pathId, type, atU) => {
    const id = `fc_${nanoid(5)}`;
    const cue: FlightCue = { id, type, atU: Math.max(0, Math.min(1, atU)), label: type, ...DEFAULT_FLIGHT_CUE[type] };
    const byPath = { ...get().byPath, [pathId]: sortByU([...(get().byPath[pathId] ?? []), cue]) };
    set({ byPath }); persist(byPath);
    return id;
  },
  update: (pathId, id, patch) => {
    const list = get().byPath[pathId] ?? [];
    const byPath = { ...get().byPath, [pathId]: sortByU(list.map((c) => (c.id === id ? { ...c, ...patch } : c))) };
    set({ byPath }); persist(byPath);
  },
  remove: (pathId, id) => {
    const byPath = { ...get().byPath, [pathId]: (get().byPath[pathId] ?? []).filter((c) => c.id !== id) };
    set({ byPath }); persist(byPath);
  },
  reorder: (pathId, id, dir) => {
    const list = get().byPath[pathId] ?? [];
    const i = list.findIndex((c) => c.id === id);
    if (i < 0) return;
    const byPath = { ...get().byPath, [pathId]: moveItem(list, i, dir) };
    set({ byPath }); persist(byPath);
  },
  importState: (data) => { const byPath = (data.byPath && typeof data.byPath === 'object') ? data.byPath : {}; set({ byPath }); persist(byPath); },
  reset: () => { set({ byPath: {} }); persist({}); },
}));

// Non-hook accessor for the 3D / runner layer (no per-frame React subscription). Always sorted by u.
export function getFlightCues(pathId: string): FlightCue[] {
  return sortByU(useEditorFlightCueStore.getState().byPath[pathId] ?? []);
}

export { FLIGHT_CUE_TYPES };
