import { create } from 'zustand';
import type { CollectibleConfig, CollectibleType, ResourceDef } from '../types/collectible';

// POLI — editable config for the primitive collectible economy (🌤 Environment tab → Collectibles). Runtime
// resource amounts live in resourceStore; this is the tunable design data. Auto-persisted to localStorage,
// imported/exported via the editor content registry (domain 'editorCollectible').

interface EditorCollectibleState extends CollectibleConfig {
  addType: () => string;
  updateType: (id: string, patch: Partial<CollectibleType>) => void;
  removeType: (id: string) => void;
  addResource: () => string;
  updateResource: (id: string, patch: Partial<ResourceDef>) => void;
  removeResource: (id: string) => void;
  importState: (data: Partial<CollectibleConfig>) => void;
  reset: () => void;
}

const STORAGE_KEY = 'r3f-rpg-builder-poli-collectible-v1';
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const uid = (p: string) => `${p}_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;

// Seed: two resources (energy → auto speed boost; spark → key-armed scan pulse) + a few primitive types.
const DEFAULTS: CollectibleConfig = {
  resources: [
    { id: 'energy', name: 'Energy', color: '#22c55e', threshold: 100, abilityType: 'speed_boost', auto: true, abilityDuration: 4, abilityStrength: 2 },
    { id: 'spark', name: 'Spark', color: '#38bdf8', threshold: 60, abilityType: 'scan_pulse', auto: false, key: 'KeyZ', abilityRadius: 14, abilityDuration: 3 },
  ],
  types: [
    { id: 'leaf', name: 'Green Cube', shape: 'box', color: '#4ade80', size: 0.35, value: 10, resourceId: 'energy', count: 10, airCount: 40, airMinHeight: 3, airMaxHeight: 24, spin: true, emissive: 0.5 },
    { id: 'orb', name: 'Energy Orb', shape: 'icosa', color: '#86efac', size: 0.4, value: 20, resourceId: 'energy', count: 5, airCount: 25, airMinHeight: 4, airMaxHeight: 26, spin: true, emissive: 0.8 },
    { id: 'crystal', name: 'Spark Crystal', shape: 'octa', color: '#7dd3fc', size: 0.4, value: 15, resourceId: 'spark', count: 8, airCount: 30, airMinHeight: 3, airMaxHeight: 22, spin: true, emissive: 0.9 },
  ],
};

function persist(s: CollectibleConfig): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ types: s.types, resources: s.resources })); } catch { /* ignore */ }
}
function load(): CollectibleConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (Array.isArray(p.types) && Array.isArray(p.resources)) return { types: p.types, resources: p.resources };
    }
  } catch { /* ignore */ }
  return clone(DEFAULTS);
}

export const useEditorCollectibleStore = create<EditorCollectibleState>((set, get) => {
  const save = () => persist({ types: get().types, resources: get().resources });
  return {
    ...load(),
    addType: () => {
      const id = uid('ctype');
      const resourceId = get().resources[0]?.id ?? 'energy';
      const t: CollectibleType = { id, name: 'New Collectible', shape: 'box', color: '#fbbf24', size: 0.35, value: 10, resourceId, count: 6, spin: true, emissive: 0.6 };
      set({ types: [...get().types, t] }); save();
      return id;
    },
    updateType: (id, patch) => { set({ types: get().types.map((t) => (t.id === id ? { ...t, ...patch } : t)) }); save(); },
    removeType: (id) => { set({ types: get().types.filter((t) => t.id !== id) }); save(); },
    addResource: () => {
      const id = uid('res');
      const r: ResourceDef = { id, name: 'New Resource', color: '#a855f7', threshold: 80, abilityType: 'heal_aura', auto: true, abilityRadius: 10, abilityDuration: 3 };
      set({ resources: [...get().resources, r] }); save();
      return id;
    },
    updateResource: (id, patch) => { set({ resources: get().resources.map((r) => (r.id === id ? { ...r, ...patch } : r)) }); save(); },
    removeResource: (id) => { set({ resources: get().resources.filter((r) => r.id !== id) }); save(); },
    importState: (data) => {
      set({
        types: Array.isArray(data.types) ? data.types : get().types,
        resources: Array.isArray(data.resources) ? data.resources : get().resources,
      });
      save();
    },
    reset: () => { const d = clone(DEFAULTS); set({ types: d.types, resources: d.resources }); save(); },
  };
});

export function getCollectibleTypes(): CollectibleType[] { return useEditorCollectibleStore.getState().types; }
export function getResourceDefs(): ResourceDef[] { return useEditorCollectibleStore.getState().resources; }
export function getResourceDef(id: string): ResourceDef | undefined { return useEditorCollectibleStore.getState().resources.find((r) => r.id === id); }
