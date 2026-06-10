import { create } from 'zustand';
import type { PathFollowerDef } from '../types/pathFollower';
import { FOLLOWER_SEED } from '../data/poli/followerSeed';

// POLI (Phase E) — authorable NPC/vehicle path followers (🛣 Tracks → Followers). Auto-persisted; round-trips
// via the content registry (domain 'editorPathFollower') and tracked for Undo. Runtime progress lives in
// followerRuntime (non-reactive); this is the design data.
interface EditorPathFollowerState {
  followers: PathFollowerDef[];
  addFollower: (areaId: string) => string;
  updateFollower: (id: string, patch: Partial<PathFollowerDef>) => void;
  removeFollower: (id: string) => void;
  mergeMissingFromSeed: () => void;
  importState: (data: { followers?: PathFollowerDef[] }) => void;
  reset: () => void;
}

const STORAGE_KEY = 'r3f-rpg-builder-poli-follower-v1';
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const uid = () => `fol_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;

function persist(followers: PathFollowerDef[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ followers })); } catch { /* ignore */ }
}
function load(): PathFollowerDef[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) { const p = JSON.parse(raw); if (Array.isArray(p.followers)) return p.followers; }
  } catch { /* ignore */ }
  return clone(FOLLOWER_SEED);
}

export const useEditorPathFollowerStore = create<EditorPathFollowerState>((set, get) => {
  const save = () => persist(get().followers);
  return {
    followers: load(),
    addFollower: (areaId) => {
      const id = uid();
      const f: PathFollowerDef = {
        id, name: 'New Follower', areaId, kind: 'vehicle', pathId: '', count: 1, speed: 6,
        lookAhead: 6, minGap: 3, color: '#38bdf8', scale: 2, size: [0.9, 1.2, 2.2],
        yieldToIncidents: true, canReroute: false, loop: true, enabled: true,
      };
      set({ followers: [...get().followers, f] }); save();
      return id;
    },
    updateFollower: (id, patch) => { set({ followers: get().followers.map((f) => (f.id === id ? { ...f, ...patch } : f)) }); save(); },
    removeFollower: (id) => { set({ followers: get().followers.filter((f) => f.id !== id) }); save(); },
    mergeMissingFromSeed: () => {
      const have = new Set(get().followers.map((f) => f.id));
      const add = FOLLOWER_SEED.filter((s) => !have.has(s.id));
      if (add.length) { set({ followers: [...get().followers, ...clone(add)] }); save(); }
    },
    importState: (data) => { set({ followers: Array.isArray(data.followers) ? data.followers : get().followers }); save(); },
    reset: () => { set({ followers: clone(FOLLOWER_SEED) }); save(); },
  };
});

export function getFollowers(): PathFollowerDef[] { return useEditorPathFollowerStore.getState().followers; }
