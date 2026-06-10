import type { GameSettings } from './settings';

// Versioned save document (PDF Batch 13). Interface only this batch — the save/migration system is built
// later; declaring the shape now keeps every store aware of what eventually persists.
export const SAVE_VERSION = 1 as const;

export interface SaveData {
  version: number;
  savedAtMs: number;
  unlockedCharacterIds: string[];
  completedMissionIds: string[];
  discoveredLocationIds: string[];
  settings: GameSettings;
  flightLog: { routeId: string; flightSec: number }[];
  transformWatchLog: string[]; // transformation ids watched
  collectibleIds: string[];
  missionStats: Record<string, number>;
}
