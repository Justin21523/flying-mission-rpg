import { useStageProgressionStore } from '../../stores/game/useStageProgressionStore';
import { getLevelLayout } from '../../stores/useLevelEditorStore';

export const StageMinimapPanel = () => {
  const state = useStageProgressionStore();
  const layout = state.activeLevelLayoutId ? getLevelLayout(state.activeLevelLayoutId) : undefined;
  if (!layout?.navigation.showMinimap) return null;
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950/75 p-2 text-xs text-slate-300">
      <div className="font-bold text-sky-200">Stage Route</div>
      <div>{layout.segmentIds.map((id) => id === state.activeSegmentId ? `[${id}]` : id).join(' → ')}</div>
    </div>
  );
};
