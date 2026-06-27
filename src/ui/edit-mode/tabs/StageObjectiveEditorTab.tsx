import { useStageDefinitionStore } from '../../../stores/useStageEditorStore';

export const StageObjectiveEditorTab = () => {
  const stages = useStageDefinitionStore((state) => state.items);
  return <div className="space-y-2 text-xs text-slate-300">{stages.map((stage) => <div key={stage.id} className="rounded border border-slate-700 p-2"><b>{stage.name}</b><br />Objectives: {stage.objectiveIds.join(', ')}</div>)}</div>;
};
