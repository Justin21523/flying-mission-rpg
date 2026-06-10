import { create } from 'zustand';
import type { SurfaceDefinition, SurfaceZoneDef } from '../types/surface';
import { SURFACE_SEED, SURFACE_ZONE_SEED } from '../data/poli/surfaceSeed';
import { editorSpawn } from './sceneEditStore';

// POLI (Phase D/F+) — authorable surface definitions + placed surface zones (🛣 Tracks → Surfaces). A zone
// applies its SurfaceDefinition's movement multipliers to the player while standing on it (SurfaceZoneLayer +
// surfaceField). Auto-persisted; round-trips via the content registry (domain 'editorSurface') + Undo.
interface EditorSurfaceState {
  surfaces: SurfaceDefinition[];
  zones: SurfaceZoneDef[];
  addSurface: () => string;
  updateSurface: (id: string, patch: Partial<SurfaceDefinition>) => void;
  removeSurface: (id: string) => void;
  addZone: (areaId: string) => string;
  updateZone: (id: string, patch: Partial<SurfaceZoneDef>) => void;
  updateZonePosition: (id: string, position: [number, number, number]) => void;
  removeZone: (id: string) => void;
  importState: (data: { surfaces?: SurfaceDefinition[]; zones?: SurfaceZoneDef[] }) => void;
  reset: () => void;
}

const STORAGE_KEY = 'r3f-rpg-builder-poli-surface-v1';
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const uid = (p = 'surf') => `${p}_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;

function persist(s: { surfaces: SurfaceDefinition[]; zones: SurfaceZoneDef[] }): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}
function load(): { surfaces: SurfaceDefinition[]; zones: SurfaceZoneDef[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (Array.isArray(p.surfaces)) return { surfaces: p.surfaces, zones: Array.isArray(p.zones) ? p.zones : clone(SURFACE_ZONE_SEED) };
    }
  } catch { /* ignore */ }
  return { surfaces: clone(SURFACE_SEED), zones: clone(SURFACE_ZONE_SEED) };
}

export const useEditorSurfaceStore = create<EditorSurfaceState>((set, get) => {
  const save = () => persist({ surfaces: get().surfaces, zones: get().zones });
  return {
    ...load(),
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
    addZone: (areaId) => {
      const id = uid('szone');
      const z: SurfaceZoneDef = {
        id, areaId, surfaceId: get().surfaces[0]?.id ?? '',
        position: [Math.round(editorSpawn.x * 100) / 100, 0, Math.round(editorSpawn.z * 100) / 100],
        size: [6, 6], enabled: true,
      };
      set({ zones: [...get().zones, z] }); save();
      return id;
    },
    updateZone: (id, patch) => { set({ zones: get().zones.map((z) => (z.id === id ? { ...z, ...patch } : z)) }); save(); },
    updateZonePosition: (id, position) => { set({ zones: get().zones.map((z) => (z.id === id ? { ...z, position } : z)) }); save(); },
    removeZone: (id) => { set({ zones: get().zones.filter((z) => z.id !== id) }); save(); },
    importState: (data) => {
      set({
        surfaces: Array.isArray(data.surfaces) ? data.surfaces : get().surfaces,
        zones: Array.isArray(data.zones) ? data.zones : get().zones,
      });
      save();
    },
    reset: () => { set({ surfaces: clone(SURFACE_SEED), zones: clone(SURFACE_ZONE_SEED) }); save(); },
  };
});

export function getSurfaces(): SurfaceDefinition[] { return useEditorSurfaceStore.getState().surfaces; }
export function getSurface(id: string): SurfaceDefinition | undefined { return useEditorSurfaceStore.getState().surfaces.find((s) => s.id === id); }
export function getSurfaceZones(): SurfaceZoneDef[] { return useEditorSurfaceStore.getState().zones; }
