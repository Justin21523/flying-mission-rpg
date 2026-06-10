import { create } from 'zustand';
import type { SurfaceDefinition } from '../types/surface';
import { SURFACE_SEED } from '../data/poli/surfaceSeed';

// POLI (Phase D) — authorable surface definitions (🛣 Tracks → Surfaces). Auto-persisted; round-trips via the
// content registry (domain 'editorSurface') and is tracked for Undo. Runtime application of the multipliers is
// a later task; this store is the authoring data layer.
interface EditorSurfaceState {
  surfaces: SurfaceDefinition[];
  addSurface: () => string;
  updateSurface: (id: string, patch: Partial<SurfaceDefinition>) => void;
  removeSurface: (id: string) => void;
  importState: (data: { surfaces?: SurfaceDefinition[] }) => void;
  reset: () => void;
}

const STORAGE_KEY = 'r3f-rpg-builder-poli-surface-v1';
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const uid = () => `surf_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;

function persist(surfaces: SurfaceDefinition[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ surfaces })); } catch { /* ignore */ }
}
function load(): SurfaceDefinition[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) { const p = JSON.parse(raw); if (Array.isArray(p.surfaces)) return p.surfaces; }
  } catch { /* ignore */ }
  return clone(SURFACE_SEED);
}

export const useEditorSurfaceStore = create<EditorSurfaceState>((set, get) => {
  const save = () => persist(get().surfaces);
  return {
    surfaces: load(),
    addSurface: () => {
      const id = uid();
      const s: SurfaceDefinition = {
        id, name: 'New Surface', surfaceType: 'custom',
        friction: 1, accelerationMultiplier: 1, maxSpeedMultiplier: 1, steeringMultiplier: 1, brakingMultiplier: 1,
        pathAssistStrength: 0, enterPathFollow: false, tags: [],
      };
      set({ surfaces: [...get().surfaces, s] }); save();
      return id;
    },
    updateSurface: (id, patch) => { set({ surfaces: get().surfaces.map((s) => (s.id === id ? { ...s, ...patch } : s)) }); save(); },
    removeSurface: (id) => { set({ surfaces: get().surfaces.filter((s) => s.id !== id) }); save(); },
    importState: (data) => { set({ surfaces: Array.isArray(data.surfaces) ? data.surfaces : get().surfaces }); save(); },
    reset: () => { set({ surfaces: clone(SURFACE_SEED) }); save(); },
  };
});

export function getSurfaces(): SurfaceDefinition[] { return useEditorSurfaceStore.getState().surfaces; }
