import { useSaveStore } from '../../stores/useSaveStore';
import type { StatKey } from '../../types/game/save';

// Batch 13 — accumulates lifetime stats into the save (debounce-persisted via useSaveStore).
const bump = (key: StatKey, delta = 1): void => useSaveStore.getState().bumpStat(key, delta);

export const StatsTracker = {
  addPlayTime(seconds: number): void { if (seconds > 0) bump('totalPlayTimeSeconds', seconds); },
  flightStarted(): void { bump('totalFlightsStarted'); },
  flightCompleted(): void { bump('totalFlightsCompleted'); },
  transformationPlayed(): void { bump('totalTransformationsPlayed'); },
  transformationSkipped(): void { bump('totalTransformationsSkipped'); },
  safeLanding(): void { bump('totalSafeLandings'); },
  roughLanding(): void { bump('totalRoughLandings'); },
  missionCompleted(): void { bump('totalMissionsCompleted'); },
  supportCall(): void { bump('totalSupportCalls'); },
  phaserCompleted(): void { bump('totalPhaserMiniGamesCompleted'); },
};
