import { getSaveData } from '../../stores/useSaveStore';
import { getEditorLocations } from '../../stores/game/editorLocationStore';
import { getEditorRoutes } from '../../stores/game/editorRouteStore';
import { ProgressTracker } from './ProgressTracker';
import type { UnlockResult } from '../../types/progressTypes';

// Batch 13 — first-pass unlock gating. Starter content is unlocked in the default save (3 characters / 3
// locations); completing a mission unlocks the next location + route placeholder. Debug can unlock all. No
// shop / gacha.
export const UnlockManager = {
  isCharacterUnlocked(id: string): boolean { return getSaveData().progress.unlockedCharacterIds.includes(id); },
  isLocationUnlocked(id: string): boolean { return getSaveData().progress.unlockedLocationIds.includes(id); },
  isRouteUnlocked(id: string): boolean { return getSaveData().progress.unlockedRouteIds.includes(id); },

  unlockNextLocation(): UnlockResult {
    const unlocked = getSaveData().progress.unlockedLocationIds;
    const next = getEditorLocations().find((l) => !unlocked.includes(l.id));
    if (next) ProgressTracker.markLocationUnlocked(next.id);
    return { kind: 'location', id: next?.id ?? null };
  },

  unlockNextRoute(): UnlockResult {
    const unlocked = getSaveData().progress.unlockedRouteIds;
    const next = getEditorRoutes().find((r) => !unlocked.includes(r.id));
    if (next) ProgressTracker.markRouteUnlocked(next.id);
    return { kind: 'route', id: next?.id ?? null };
  },
};
