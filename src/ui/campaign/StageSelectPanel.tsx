import { getCampaignDefinition, getStagesForCampaign } from '../../stores/useStageEditorStore';
import { useStageProgressionStore } from '../../stores/game/useStageProgressionStore';
import { getUnlockedStageIds } from '../../game/campaign/StageUnlockController';
import { startStage } from '../../game/campaign/CampaignDirector';
import { RESCUE_VANGUARD_CAMPAIGN_ID } from '../../data/campaigns/campaignDefinitions';
import { chip, panel } from '../game/screenChrome';
import { StageCard } from './StageCard';

export const StageSelectPanel = () => {
  const state = useStageProgressionStore();
  const campaign = getCampaignDefinition(state.activeCampaignId ?? RESCUE_VANGUARD_CAMPAIGN_ID);
  if (!campaign) return null;
  const stages = getStagesForCampaign(campaign.id);
  const unlocked = new Set(getUnlockedStageIds(campaign, state));
  return (
    <div className={`${panel} p-3`}>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-bold text-sky-200">Campaign Map</h2>
        <span className={`${chip} border-slate-600 text-slate-300`}>{campaign.name}</span>
      </div>
      <div className="grid gap-2">
        {stages.map((stage) => {
          const isUnlocked = unlocked.has(stage.id);
          const done = state.completedStageIds.includes(stage.id);
          return <StageCard key={stage.id} stage={stage} unlocked={isUnlocked} completed={done} onStart={() => startStage(stage.id)} />;
        })}
      </div>
    </div>
  );
};
