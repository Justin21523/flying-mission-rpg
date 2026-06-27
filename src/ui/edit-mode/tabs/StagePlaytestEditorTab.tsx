import { completeStage, resetCampaign, startStage } from '../../../game/campaign/CampaignDirector';
import { triggerEncounter } from '../../../game/encounters/EncounterDirector';
import { jumpToLevelSegment } from '../../../game/levels/LevelSegmentController';
import { getStageDefinitions } from '../../../stores/useStageEditorStore';
import { useStageProgressionStore } from '../../../stores/game/useStageProgressionStore';

export const StagePlaytestEditorTab = () => {
  const state = useStageProgressionStore();
  const stages = getStageDefinitions();
  return (
    <div className="space-y-2 text-xs text-slate-300">
      <div>Active: {state.activeStageId ?? 'none'} · {state.status}</div>
      {stages.map((stage) => <button key={stage.id} className="block rounded border border-slate-700 p-2 text-left" onClick={() => startStage(stage.id)}>Start {stage.name}</button>)}
      <button className="rounded border border-slate-700 px-2 py-1" onClick={() => state.activeStageId && completeStage(state.activeStageId)}>Clear stage</button>
      <button className="rounded border border-slate-700 px-2 py-1" onClick={() => state.activeSegmentId && jumpToLevelSegment(state.activeSegmentId)}>Jump active segment</button>
      <button className="rounded border border-slate-700 px-2 py-1" onClick={() => state.activeEncounterIds[0] && triggerEncounter(state.activeEncounterIds[0])}>Spawn active encounter</button>
      <button className="rounded border border-slate-700 px-2 py-1" onClick={resetCampaign}>Reset campaign</button>
    </div>
  );
};
