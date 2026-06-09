import { create } from 'zustand';
import type { YokaiType, YokaiBehavior } from '../types/yokai';

// POLI yokai-hunt — editable roster of yokai TYPES (AI behaviour + combat stats), persisted to localStorage
// (mirrors editorCollectibleStore). Hunts spawn from the enabled types. Empty modelAssetId → a random yokai
// model from public/models/yokais each spawn.

const STORAGE_KEY = 'r3f-rpg-builder-poli-yokai-types-v1';
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const uid = () => `yk_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;

const mk = (name: string, color: string, behavior: YokaiBehavior, p: Partial<YokaiType>): YokaiType => ({
  id: uid(), name, color, behavior, modelAssetId: '', elite: false,
  hp: 50, moveSpeed: 3, aggroRange: 12, attackRange: 1.8, attackRate: 1.5, attackDamage: 6, fleeHpPct: 0.2,
  enabled: true, ...p,
});

const DEFAULTS: YokaiType[] = [
  mk('Rusher', '#a855f7', 'chaser', { hp: 45, moveSpeed: 3.4 }),
  mk('Lurker', '#7c3aed', 'ambusher', { hp: 55, moveSpeed: 2.6, aggroRange: 9 }),
  mk('Spitter', '#22d3ee', 'kiter', { hp: 40, moveSpeed: 3, attackRange: 8, attackRate: 2 }),
  mk('Swarmling', '#f472b6', 'swarmer', { hp: 35, moveSpeed: 3.2 }),
  mk('Brute', '#ef4444', 'chaser', { elite: true, hp: 140, moveSpeed: 2.4, attackDamage: 12 }),
];

interface EditorYokaiState {
  types: YokaiType[];
  addType: () => void;
  updateType: (id: string, patch: Partial<YokaiType>) => void;
  removeType: (id: string) => void;
  importState: (data: { types?: YokaiType[] }) => void;
  reset: () => void;
}

function persist(types: YokaiType[]): void { try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ types })); } catch { /* ignore */ } }
function load(): YokaiType[] {
  try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) { const p = JSON.parse(raw); if (Array.isArray(p.types)) return p.types; } } catch { /* ignore */ }
  return clone(DEFAULTS);
}

export const useEditorYokaiStore = create<EditorYokaiState>((set, get) => {
  const save = () => persist(get().types);
  return {
    types: load(),
    addType: () => { set({ types: [...get().types, mk('New Yokai', '#a855f7', 'chaser', {})] }); save(); },
    updateType: (id, patch) => { set({ types: get().types.map((t) => (t.id === id ? { ...t, ...patch } : t)) }); save(); },
    removeType: (id) => { set({ types: get().types.filter((t) => t.id !== id) }); save(); },
    importState: (data) => { set({ types: Array.isArray(data.types) ? data.types : get().types }); save(); },
    reset: () => { set({ types: clone(DEFAULTS) }); save(); },
  };
});

export function getEnabledYokaiTypes(): YokaiType[] {
  return useEditorYokaiStore.getState().types.filter((t) => t.enabled);
}
