import { useMemo } from 'react';
import { useStageProgressionStore } from '../../stores/game/useStageProgressionStore';
import { getStageDefinition } from '../../stores/useStageEditorStore';
import { getStageContentPack, getStagePlaytestScenario } from '../../stores/useStageContentEditorStore';

export const EditModeExportPanel = () => {
  const stageId = useStageProgressionStore((state) => state.activeStageId);
  const snapshot = useMemo(() => {
    const stage = stageId ? getStageDefinition(stageId) : undefined;
    return JSON.stringify({
      stage,
      contentPack: stage ? getStageContentPack(stage.id) : undefined,
      playtestScenario: stage ? getStagePlaytestScenario(stage.id) : undefined,
    }, null, 2);
  }, [stageId]);
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950/45 p-3">
      <div className="mb-2 text-sm font-bold text-slate-100">Export Current Stage JSON</div>
      <textarea readOnly value={snapshot} className="h-36 w-full resize-none rounded bg-slate-950/80 p-2 font-mono text-[10px] text-slate-300" />
    </div>
  );
};
