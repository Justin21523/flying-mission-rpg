import { getStagePolishPreset } from '../../stores/useStageContentEditorStore';

export const RewardUnlockToast = ({ stageId }: { stageId: string }) => {
  const polish = getStagePolishPreset(stageId);
  if (!polish) return null;
  return (
    <div className="mt-3 rounded border border-amber-400/50 bg-amber-950/25 p-3 text-sm text-amber-100">
      <div className="font-bold">{polish.rewardToastTitle}</div>
      <div className="text-xs text-amber-200/80">{polish.rewardToastBody}</div>
    </div>
  );
};
