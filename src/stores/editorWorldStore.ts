import { create } from 'zustand';
import { BROOMS_TOWN_DISTRICTS, BROOMS_TOWN_WORLD_AREAS } from '../data/world/broomsTownWorld';
import type { District, DistrictCategory, WorldArea, EdgeDir } from '../types/world';
import { OPPOSITE_EDGE } from '../types/world';

// Editable districts + areas (🗺 World tab). Seeded from broomsTownWorld; becomes the authoritative area
// list once seeded (getAllAreas in data/areas.ts reads it). Auto-persisted. Mirrors the other editor stores.

interface EditorWorldState {
  districts: District[];
  areas: WorldArea[];
  useEdgeWalk: boolean; // walk-off-edge transitions (no portal gates) — global toggle
  fadeEnabled: boolean; // quick fade during edge transitions
  selectedDistrictId: string | null;
  selectedAreaId: string | null;
  // districts
  addDistrict: () => string;
  updateDistrict: (id: string, patch: Partial<District>) => void;
  removeDistrict: (id: string) => void;
  selectDistrict: (id: string | null) => void;
  // areas
  addArea: (districtId: string) => string;
  updateArea: (id: string, patch: Partial<WorldArea>) => void;
  setAreaEdge: (id: string, edge: EdgeDir, neighbour: string | undefined) => void;
  removeArea: (id: string) => void;
  selectArea: (id: string | null) => void;
  // global
  setEdgeWalk: (on: boolean) => void;
  setFadeEnabled: (on: boolean) => void;
  // io
  importState: (data: { districts?: District[]; areas?: WorldArea[]; useEdgeWalk?: boolean; fadeEnabled?: boolean }) => void;
  reset: () => void;
}

const STORAGE_KEY = 'r3f-rpg-builder-poli-world-v1';
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

function persist(s: Pick<EditorWorldState, 'districts' | 'areas' | 'useEdgeWalk' | 'fadeEnabled'>): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ districts: s.districts, areas: s.areas, useEdgeWalk: s.useEdgeWalk, fadeEnabled: s.fadeEnabled })); } catch { /* ignore */ }
}
function load(): Pick<EditorWorldState, 'districts' | 'areas' | 'useEdgeWalk' | 'fadeEnabled'> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (Array.isArray(p.districts) && Array.isArray(p.areas)) {
        return { districts: p.districts, areas: p.areas, useEdgeWalk: p.useEdgeWalk !== false, fadeEnabled: p.fadeEnabled !== false };
      }
    }
  } catch { /* ignore */ }
  return { districts: clone(BROOMS_TOWN_DISTRICTS), areas: clone(BROOMS_TOWN_WORLD_AREAS), useEdgeWalk: true, fadeEnabled: true };
}

const uid = (p: string) => `${p}_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;

export const useEditorWorldStore = create<EditorWorldState>((set, get) => {
  const save = () => persist(get());
  return {
    ...load(),
    selectedDistrictId: null,
    selectedAreaId: null,

    addDistrict: () => {
      const id = uid('district');
      const d: District = { id, name: 'New District', category: 'general' as DistrictCategory, areaIds: [] };
      set({ districts: [...get().districts, d], selectedDistrictId: id }); save();
      return id;
    },
    updateDistrict: (id, patch) => { set({ districts: get().districts.map((d) => (d.id === id ? { ...d, ...patch } : d)) }); save(); },
    removeDistrict: (id) => {
      // Detach its areas (keep the areas; just clear their districtId) and drop the district.
      set({
        districts: get().districts.filter((d) => d.id !== id),
        areas: get().areas.map((a) => (a.districtId === id ? { ...a, districtId: undefined } : a)),
        selectedDistrictId: get().selectedDistrictId === id ? null : get().selectedDistrictId,
      });
      save();
    },
    selectDistrict: (id) => set({ selectedDistrictId: id }),

    addArea: (districtId) => {
      const id = uid('area');
      const a: WorldArea = { id, name: 'New Area', districtId, biome: 'campus', size: 40, edges: {}, spawnPoint: { x: 0, y: 3, z: 0 } };
      const districts = get().districts.map((d) => (d.id === districtId ? { ...d, areaIds: [...d.areaIds, id] } : d));
      set({ areas: [...get().areas, a], districts, selectedAreaId: id }); save();
      return id;
    },
    updateArea: (id, patch) => { set({ areas: get().areas.map((a) => (a.id === id ? { ...a, ...patch } : a)) }); save(); },
    setAreaEdge: (id, edge, neighbour) => {
      const opp = OPPOSITE_EDGE[edge];
      set({
        areas: get().areas.map((a) => {
          if (a.id === id) return { ...a, edges: { ...a.edges, [edge]: neighbour || undefined } };
          // Keep reciprocal: the chosen neighbour gets the opposite edge pointing back; any area that
          // previously pointed back via the opposite edge is cleared.
          if (neighbour && a.id === neighbour) return { ...a, edges: { ...a.edges, [opp]: id } };
          if (a.edges?.[opp] === id && a.id !== neighbour) return { ...a, edges: { ...a.edges, [opp]: undefined } };
          return a;
        }),
      });
      save();
    },
    removeArea: (id) => {
      set({
        areas: get().areas
          .filter((a) => a.id !== id)
          .map((a) => (a.edges ? { ...a, edges: Object.fromEntries(Object.entries(a.edges).filter(([, n]) => n !== id)) } : a)),
        districts: get().districts.map((d) => ({ ...d, areaIds: d.areaIds.filter((x) => x !== id) })),
        selectedAreaId: get().selectedAreaId === id ? null : get().selectedAreaId,
      });
      save();
    },
    selectArea: (id) => set({ selectedAreaId: id }),

    setEdgeWalk: (on) => { set({ useEdgeWalk: on }); save(); },
    setFadeEnabled: (on) => { set({ fadeEnabled: on }); save(); },

    importState: (data) => {
      set({
        districts: Array.isArray(data.districts) ? data.districts : get().districts,
        areas: Array.isArray(data.areas) ? data.areas : get().areas,
        useEdgeWalk: typeof data.useEdgeWalk === 'boolean' ? data.useEdgeWalk : get().useEdgeWalk,
        fadeEnabled: typeof data.fadeEnabled === 'boolean' ? data.fadeEnabled : get().fadeEnabled,
      });
      save();
    },
    reset: () => { set({ districts: clone(BROOMS_TOWN_DISTRICTS), areas: clone(BROOMS_TOWN_WORLD_AREAS), useEdgeWalk: true, fadeEnabled: true, selectedDistrictId: null, selectedAreaId: null }); save(); },
  };
});

export function getWorldDistricts(): District[] { return useEditorWorldStore.getState().districts; }
export function getWorldAreas(): WorldArea[] { return useEditorWorldStore.getState().areas; }
export function getWorldArea(id: string): WorldArea | undefined { return useEditorWorldStore.getState().areas.find((a) => a.id === id); }
export function getAreaSize(id: string): number { return useEditorWorldStore.getState().areas.find((a) => a.id === id)?.size ?? 40; }
