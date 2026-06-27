import { startStage } from '../../game/campaign/CampaignDirector';
import { getCampaignDefinition, getStageDefinition } from '../../stores/useStageEditorStore';
import { RESCUE_VANGUARD_CAMPAIGN_ID } from '../../data/campaigns/campaignDefinitions';
import { useStageProgressionStore } from '../../stores/game/useStageProgressionStore';
import { useDemoModeStore } from '../../stores/useDemoModeStore';
import { panel } from '../game/screenChrome';
import { StageNodeCard } from './StageNodeCard';
import { CampaignProgressSummary } from './CampaignProgressSummary';

export const CampaignMapPolished = () => {
  const campaign = getCampaignDefinition(RESCUE_VANGUARD_CAMPAIGN_ID);
  const unlocked = useStageProgressionStore((state) => state.unlockedStageIds);
  const completed = useStageProgressionStore((state) => state.completedStageIds);
  const defaultStageId = useDemoModeStore((state) => state.defaultStageId);
  if (!campaign) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 text-slate-100">
      <div className={`mb-4 ${panel} p-4`}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase text-sky-300">Campaign Map</div>
            <h2 className="text-2xl font-black">{campaign.name}</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-300">{campaign.description}</p>
          </div>
          <CampaignProgressSummary />
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {campaign.stageIds.map((stageId) => {
          const stage = getStageDefinition(stageId);
          if (!stage) return null;
          const isUnlocked = unlocked.includes(stage.id);
          const isCompleted = completed.includes(stage.id);
          return (
            <StageNodeCard
              key={stage.id}
              stage={stage}
              unlocked={isUnlocked}
              completed={isCompleted}
              demoRecommended={stage.id === defaultStageId}
              onStart={() => startStage(stage.id)}
            />
          );
        })}
      </div>
    </div>
  );
};
