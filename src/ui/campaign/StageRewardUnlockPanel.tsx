import type { StageDefinition } from '../../types/stageTypes';
import { getStageReward } from '../../stores/useStageEditorStore';

export const StageRewardUnlockPanel = ({ stage }: { stage: StageDefinition }) => {
  const reward = getStageReward(stage.rewardId);
  return (
    <div className="mt-4 rounded-lg border border-amber-400/30 bg-amber-950/25 p-3 text-sm text-amber-100">
      <div className="text-[10px] font-bold uppercase text-amber-300">Reward Gained</div>
      <div className="mt-1 font-bold">{reward?.name ?? 'Campaign progress updated'}</div>
      {reward?.description && <div className="mt-1 text-xs text-amber-100/80">{reward.description}</div>}
    </div>
  );
};
