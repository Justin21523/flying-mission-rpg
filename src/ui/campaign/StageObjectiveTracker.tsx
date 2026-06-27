import { useStageProgressionStore } from '../../stores/game/useStageProgressionStore';
import { getStageDefinition } from '../../stores/useStageEditorStore';

export const StageObjectiveTracker = () => {
  const state = useStageProgressionStore();
  const stage = state.activeStageId ? getStageDefinition(state.activeStageId) : undefined;
  if (!stage) return null;
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950/75 p-2 text-xs text-slate-200">
      <div className="font-bold text-sky-200">Objectives</div>
      {stage.objectiveIds.map((id) => (
        <div key={id} className={state.completedObjectiveIds.includes(id) ? 'text-emerald-300' : 'text-slate-300'}>{state.completedObjectiveIds.includes(id) ? '✓' : '□'} {id}</div>
      ))}
    </div>
  );
};
