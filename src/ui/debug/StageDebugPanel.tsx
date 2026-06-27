import { completeStage, failStage } from '../../game/campaign/CampaignDirector';
import { jumpToLevelSegment } from '../../game/levels/LevelSegmentController';
import { useStageProgressionStore } from '../../stores/game/useStageProgressionStore';
import { getLevelLayout } from '../../stores/useLevelEditorStore';
import { Btn, panel } from '../game/screenChrome';
import { getStageDefinition } from '../../stores/useStageEditorStore';
import { getStagePlaytestScenario } from '../../stores/useStageContentEditorStore';
import { buildStagePlaytestReport } from '../../game/playtest/StagePlaytestAssertions';

export const StageDebugPanel = () => {
  const state = useStageProgressionStore();
  const layout = state.activeLevelLayoutId ? getLevelLayout(state.activeLevelLayoutId) : undefined;
  const stage = state.activeStageId ? getStageDefinition(state.activeStageId) : undefined;
  const report = stage ? buildStagePlaytestReport(stage, getStagePlaytestScenario(stage.id)) : undefined;
  if (!state.activeStageId) return null;
  return (
    <div className={`${panel} fixed right-3 top-[22rem] z-50 w-72 p-3 text-xs`}>
      <div className="mb-2 font-bold text-sky-200">Stage Debug</div>
      <div className="text-slate-300">{state.activeStageId} · {state.status}</div>
      <div className="mt-2 flex gap-1">
        <Btn tone="ghost" onClick={() => completeStage(state.activeStageId!)}>Force clear</Btn>
        <Btn tone="ghost" onClick={() => failStage(state.activeStageId!)}>Fail</Btn>
      </div>
      {report && <div className="mt-2 rounded border border-slate-700 p-2 text-slate-300">Playtest: {report.validationStatus} · D{report.estimatedDifficulty} · {report.estimatedDurationMinutes}m</div>}
      {layout?.segmentIds.map((id) => <button key={id} className="mt-1 block text-left text-slate-300 hover:text-white" onClick={() => jumpToLevelSegment(id)}>{id}</button>)}
    </div>
  );
};
