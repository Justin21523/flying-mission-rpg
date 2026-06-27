import { claimStageReward, previewStageReward } from '../../game/campaign/StageRewardController';
import { useGameStore } from '../../stores/game/useGameStore';
import { useStageProgressionStore } from '../../stores/game/useStageProgressionStore';
import { getStageDefinition } from '../../stores/useStageEditorStore';
import { isBranchFork, unlockedRoutesForStage } from '../../game/campaign/branchRoutes';
import { Btn, panel } from '../game/screenChrome';

export const StageRewardPanel = () => {
  const stageId = useStageProgressionStore((state) => state.activeStageId);
  const stage = stageId ? getStageDefinition(stageId) : undefined;
  if (!stage) return null;
  const reward = previewStageReward(stage);
  const routes = unlockedRoutesForStage(stage).map((id) => getStageDefinition(id)?.name ?? id);
  const fork = isBranchFork(stage);
  return (
    <div className={`mx-auto max-w-xl ${panel} p-5`}>
      <div className="text-sm font-bold text-amber-200">Stage Reward</div>
      <h2 className="mt-1 text-xl font-black text-slate-100">{reward?.name ?? 'Reward Claimed'}</h2>
      <p className="mt-2 text-sm text-slate-300">{reward?.description ?? 'No configured reward.'}</p>
      {fork ? (
        <div className="mt-3 rounded-lg border border-amber-400/40 bg-amber-950/30 p-2 text-xs">
          <div className="font-bold text-amber-200">🌟 New routes unlocked — choose your path on the map:</div>
          <div className="mt-1 text-amber-100">{routes.join('  ·  ')}</div>
        </div>
      ) : (
        <div className="mt-2 text-xs text-slate-400">Unlocks: {routes.join(', ') || 'none'}</div>
      )}
      <div className="mt-4 flex justify-end">
        <Btn tone="primary" onClick={() => {
          claimStageReward(stage);
          useGameStore.getState().requestTransition('MISSION_CONTROL');
        }}>Claim and Return</Btn>
      </div>
    </div>
  );
};
