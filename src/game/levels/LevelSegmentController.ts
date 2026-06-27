import { getLevelLayout } from '../../stores/useLevelEditorStore';
import { useStageProgressionStore } from '../../stores/game/useStageProgressionStore';

export function jumpToLevelSegment(segmentId: string): boolean {
  const state = useStageProgressionStore.getState();
  if (!state.activeLevelLayoutId) return false;
  const layout = getLevelLayout(state.activeLevelLayoutId);
  if (!layout?.segmentIds.includes(segmentId)) return false;
  state.setActiveSegment(segmentId);
  return true;
}

export function getNextLevelSegmentId(segmentId: string): string | undefined {
  const state = useStageProgressionStore.getState();
  if (!state.activeLevelLayoutId) return undefined;
  const layout = getLevelLayout(state.activeLevelLayoutId);
  if (!layout) return undefined;
  const index = layout.segmentIds.indexOf(segmentId);
  return index >= 0 ? layout.segmentIds[index + 1] : undefined;
}
