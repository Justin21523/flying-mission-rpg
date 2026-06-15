import { nanoid } from 'nanoid';
import { createEditorCollection } from './createEditorCollection';
import type { ObstacleDefinition } from '../../types/game/obstacle';
import { SEED_OBSTACLES } from '../../data/obstacles/obstacleDefinitions';

// Editable obstacle definitions (🧱 Obstacles tab). Seed-merged at boot in seedGameContent.
export const useEditorObstacleStore = createEditorCollection<ObstacleDefinition>({
  storageKey: 'aero-rescue-editor-obstacle-v1',
  seed: SEED_OBSTACLES,
  makeId: () => `obstacle_${nanoid(6)}`,
});

export function getObstacleDefs(): ObstacleDefinition[] {
  return useEditorObstacleStore.getState().items;
}
export function getObstacleDef(id: string): ObstacleDefinition | undefined {
  return useEditorObstacleStore.getState().items.find((o) => o.id === id);
}
export function getObstaclesForSegment(segmentId: string): ObstacleDefinition[] {
  return useEditorObstacleStore.getState().items.filter((o) => o.segmentId === segmentId && o.enabled !== false);
}
