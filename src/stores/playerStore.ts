import { create } from 'zustand';

type Vec = { x: number; y: number; z: number };

export interface PlayerState {
  position: Vec | null;
  currentAreaId: string;
  spawnRequest: Vec | null;
  distanceTraveled: number;
  travelGuardUntil: number; // ms timestamp: ignore edge/teleport triggers until then (anti bounce-back)
  setPosition: (pos: Vec) => void;
  setCurrentAreaId: (id: string) => void;
  requestSpawn: (pos: Vec) => void;
  clearSpawnRequest: () => void;
  travelToArea: (areaId: string, spawnPoint: Vec) => void;
}

const TRAVEL_GUARD_MS = 1500; // grace period after any area travel / spawn before edges can fire again

// NOTE: the player's edited spawn position is NOT stored here. It lives in the kit sceneEditStore
// under objKey(areaId, 'npc', 'poli') (set by the Edit-Mode gizmo, auto-persisted) and is applied
// to the body by Player.tsx on area-enter / reload — a single source of truth for the transform.
export const usePlayerStore = create<PlayerState>((set, get) => ({
  position: null,
  currentAreaId: 'rescue_hq',
  spawnRequest: null,
  distanceTraveled: 0,
  travelGuardUntil: 0,
  setPosition: (pos) => {
    const prev = get().position;
    const delta = prev
      ? Math.sqrt((pos.x - prev.x) ** 2 + (pos.z - prev.z) ** 2)
      : 0;
    set({ position: pos, distanceTraveled: get().distanceTraveled + delta });
  },
  setCurrentAreaId: (id) => set({ currentAreaId: id }),
  requestSpawn: (pos) => set({ spawnRequest: pos, travelGuardUntil: Date.now() + TRAVEL_GUARD_MS }),
  clearSpawnRequest: () => set({ spawnRequest: null }),
  travelToArea: (areaId, spawnPoint) => set({ currentAreaId: areaId, spawnRequest: spawnPoint, travelGuardUntil: Date.now() + TRAVEL_GUARD_MS }),
}));
