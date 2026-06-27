import type { StageDefinition } from '../../types/stageTypes';
import { getStageDefinition } from '../../stores/useStageEditorStore';

export const NextStageUnlockedPanel = ({ stage }: { stage: StageDefinition }) => {
  const next = stage.unlocksOnClear.stageIds?.map(getStageDefinition).find(Boolean);
  if (!next) return <div className="mt-3 text-xs text-emerald-200">Campaign finale complete.</div>;
  return (
    <div className="mt-3 rounded border border-emerald-500/30 bg-emerald-950/25 p-3 text-xs text-emerald-100">
      Next stage unlocked: <span className="font-bold">{next.name}</span>
    </div>
  );
};
