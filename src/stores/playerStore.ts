import { create } from 'zustand';

type Vec = { x: number; y: number; z: number };

export interface PlayerState {
  position: Vec | null;
  currentAreaId: string;
  spawnRequest: Vec | null;
  distanceTraveled: number;
  /** Per-area player spawn position set in Edit Mode (persisted) — applied in Play Mode too. */
  spawnOverrides: Record<string, Vec>;
  setPosition: (pos: Vec) => void;
  setCurrentAreaId: (id: string) => void;
  requestSpawn: (pos: Vec) => void;
  clearSpawnRequest: () => void;
  travelToArea: (areaId: string, spawnPoint: Vec) => void;
  setSpawnOverride: (areaId: string, pos: Vec) => void;
}

const SPAWN_KEY = 'r3f-rpg-builder-poli-player-spawn-v1';

function loadSpawns(): Record<string, Vec> {
  try {
    const raw = localStorage.getItem(SPAWN_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw);
    return p && typeof p === 'object' ? (p as Record<string, Vec>) : {};
  } catch { return {}; }
}

function persistSpawns(s: Record<string, Vec>): void {
  try { localStorage.setItem(SPAWN_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  position: null,
  currentAreaId: 'rescue_hq',
  spawnRequest: null,
  distanceTraveled: 0,
  spawnOverrides: loadSpawns(),
  setPosition: (pos) => {
    const prev = get().position;
    const delta = prev
      ? Math.sqrt((pos.x - prev.x) ** 2 + (pos.z - prev.z) ** 2)
      : 0;
    set({ position: pos, distanceTraveled: get().distanceTraveled + delta });
  },
  setCurrentAreaId: (id) => set({ currentAreaId: id }),
  requestSpawn: (pos) => set({ spawnRequest: pos }),
  clearSpawnRequest: () => set({ spawnRequest: null }),
  travelToArea: (areaId, spawnPoint) => {
    // An Edit-Mode spawn override for the destination wins over the gate's default spawn.
    const ov = get().spawnOverrides[areaId];
    set({ currentAreaId: areaId, spawnRequest: ov ?? spawnPoint });
  },
  setSpawnOverride: (areaId, pos) => {
    const next = { ...get().spawnOverrides, [areaId]: pos };
    set({ spawnOverrides: next });
    persistSpawns(next);
  },
}));
