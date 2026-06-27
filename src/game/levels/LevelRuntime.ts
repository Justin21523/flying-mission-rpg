import type { LevelLayoutDefinition } from '../../types/levelTypes';
import { getLevelLayout, getLevelSegmentsForLayout } from '../../stores/useLevelEditorStore';
import { useStageProgressionStore } from '../../stores/game/useStageProgressionStore';

let activeLayout: LevelLayoutDefinition | undefined;

export function loadLevelLayout(layoutId: string): LevelLayoutDefinition {
  const layout = getLevelLayout(layoutId);
  if (!layout) throw new Error(`Level layout not found: ${layoutId}`);
  activeLayout = layout;
  getLevelSegmentsForLayout(layout.id);
  useStageProgressionStore.getState().setRuntime({ activeLevelLayoutId: layout.id, activeSegmentId: layout.startSegmentId });
  return layout;
}

export function getActiveLevelLayout(): LevelLayoutDefinition | undefined {
  return activeLayout;
}

export function cleanupLevelRuntime(): void {
  activeLayout = undefined;
}
