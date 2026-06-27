import { useStageRewardStore } from '../../../stores/useStageEditorStore';

export const StageRewardEditorTab = () => {
  const rewards = useStageRewardStore((state) => state.items);
  return <div className="space-y-2 text-xs text-slate-300">{rewards.map((reward) => <div key={reward.id} className="rounded border border-slate-700 p-2"><b>{reward.name}</b><br />Coins {reward.coins ?? 0} · Unlock stages {(reward.unlockStageIds ?? []).join(', ')}</div>)}</div>;
};
