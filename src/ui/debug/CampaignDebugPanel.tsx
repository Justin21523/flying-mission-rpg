import { getCampaignDefinitions } from '../../stores/useStageEditorStore';
import { useStageProgressionStore } from '../../stores/game/useStageProgressionStore';
import { resetCampaign, startStage } from '../../game/campaign/CampaignDirector';
import { Btn, panel } from '../game/screenChrome';

export const CampaignDebugPanel = () => {
  const campaigns = getCampaignDefinitions();
  const state = useStageProgressionStore();
  if (!campaigns.length) return null;
  return (
    <div className={`${panel} fixed right-3 top-24 z-50 w-72 p-3 text-xs`}>
      <div className="mb-2 font-bold text-sky-200">Campaign Debug</div>
      <div className="text-slate-300">Active: {state.activeCampaignId ?? 'none'}</div>
      <div className="mt-2 flex flex-wrap gap-1">
        <Btn tone="ghost" onClick={() => useStageProgressionStore.getState().setRuntime({ debug: { ...(state.debug ?? { allowForceClear: true, allowJumpToStage: true, godMode: false, unlockAllStages: false }), unlockAllStages: true } })}>Unlock all</Btn>
        <Btn tone="ghost" onClick={resetCampaign}>Reset</Btn>
      </div>
      {campaigns[0].stageIds.map((id) => <button key={id} className="mt-1 block text-left text-slate-300 hover:text-white" onClick={() => startStage(id)}>{id}</button>)}
    </div>
  );
};
