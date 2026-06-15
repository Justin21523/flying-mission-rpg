import { create } from 'zustand';
import type { ObstacleState } from '../../types/game/obstacle';

// Runtime state for live obstacles in the active segment (Batch C). Mirrors the combat target pattern:
// per-obstacle mutable data in a module array; the store carries a `version` bumped on spawn / state change
// so the renderer + HUD re-read. Damageable obstacles also have a proxy CombatTarget (targetId) that takes
// the actual damage through the combat pipeline; ObstacleDirector syncs proxy hp → obstacle.

export interface LiveObstacle {
  id: string;
  defId: string;
  state: ObstacleState;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  interactCount: number;
  repairAmount: number;
  x: number; y: number; z: number;
  segmentId: string;
  targetId?: string; // proxy CombatTarget id (damageable obstacles)
}

export const liveObstacles: LiveObstacle[] = [];

interface ObstacleStoreState {
  version: number;
  bump: () => void;
  reset: () => void;
}

export const useObstacleStore = create<ObstacleStoreState>((set, get) => ({
  version: 0,
  bump: () => set({ version: get().version + 1 }),
  reset: () => { liveObstacles.length = 0; set({ version: get().version + 1 }); },
}));

export function getLiveObstacle(id: string): LiveObstacle | undefined {
  return liveObstacles.find((o) => o.id === id);
}
