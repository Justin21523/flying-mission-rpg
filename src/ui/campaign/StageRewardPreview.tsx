import type { StageDefinition } from '../../types/stageTypes';
import { getStageReward } from '../../stores/useStageEditorStore';

export const StageRewardPreview = ({ stage }: { stage: StageDefinition }) => {
  const reward = getStageReward(stage.rewardId);
  if (!reward) return <div className="mt-2 text-[10px] text-slate-500">Reward pending</div>;
  return (
    <div className="mt-2 rounded border border-amber-400/25 bg-amber-950/25 px-2 py-1 text-[11px] text-amber-100">
      <span className="font-bold">Reward:</span> {reward.name}
    </div>
  );
};
