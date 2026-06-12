import { useSaveStore } from '../../stores/useSaveStore';

// Batch 13 — records progress into the save (via useSaveStore, which debounce-persists). Thin + idempotent
// (addProgressId dedupes). Called by progressObservers and the AutoPlaytester; safe to call repeatedly.
export const ProgressTracker = {
  markMissionCompleted(id: string): void { useSaveStore.getState().addProgressId('completedMissionIds', id); },
  markObjectiveCompleted(id: string): void { useSaveStore.getState().addProgressId('completedObjectiveIds', id); },
  markTransformationWatched(id: string): void { if (id) useSaveStore.getState().addProgressId('watchedTransformationTimelineIds', id); },
  markLocationUnlocked(id: string): void { useSaveStore.getState().addProgressId('unlockedLocationIds', id); },
  markRouteUnlocked(id: string): void { useSaveStore.getState().addProgressId('unlockedRouteIds', id); },
  markCharacterUnlocked(id: string): void { useSaveStore.getState().addProgressId('unlockedCharacterIds', id); },
  markItemCollected(id: string): void { useSaveStore.getState().addProgressId('collectedItemIds', id); },
};
