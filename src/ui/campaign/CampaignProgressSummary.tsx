import { RESCUE_VANGUARD_CAMPAIGN_ID } from '../../data/campaigns/campaignDefinitions';
import { getCampaignDefinition } from '../../stores/useStageEditorStore';
import { useStageProgressionStore } from '../../stores/game/useStageProgressionStore';

export const CampaignProgressSummary = () => {
  const campaign = getCampaignDefinition(RESCUE_VANGUARD_CAMPAIGN_ID);
  const completed = useStageProgressionStore((state) => state.completedStageIds.length);
  const total = campaign?.stageIds.length ?? 0;
  const pct = total ? Math.round((completed / total) * 100) : 0;
  return (
    <div className="min-w-44 rounded-lg border border-slate-700 bg-slate-950/60 p-3">
      <div className="flex justify-between text-[10px] uppercase text-slate-400"><span>Progress</span><span>{pct}%</span></div>
      <div className="mt-2 h-2 rounded bg-slate-800">
        <div className="h-full rounded bg-emerald-400" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1 text-xs text-slate-300">{completed} / {total} stages clear</div>
    </div>
  );
};
