import { useGameStore } from '../../stores/game/useGameStore';
import { useStageProgressionStore } from '../../stores/game/useStageProgressionStore';
import { getStageDefinition, getStageReward } from '../../stores/useStageEditorStore';
import { Btn, panel } from '../game/screenChrome';
import { StageBriefingMapPreview } from './StageBriefingMapPreview';
import { StageObjectiveList } from './StageObjectiveList';
import { StageThreatList } from './StageThreatList';
import { LoadoutRecommendationPanel } from './LoadoutRecommendationPanel';

export const StageBriefingPolished = () => {
  const stageId = useStageProgressionStore((state) => state.activeStageId);
  const stage = stageId ? getStageDefinition(stageId) : undefined;
  const requestTransition = useGameStore((state) => state.requestTransition);
  if (!stage) return null;
  const reward = getStageReward(stage.rewardId);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 text-slate-100">
      <div className={`${panel} overflow-hidden p-0`}>
        <div className="border-b border-slate-800 bg-slate-950/55 p-5">
          <div className="text-[11px] font-bold uppercase text-sky-300">Stage Briefing</div>
          <h2 className="mt-1 text-3xl font-black">{stage.name}</h2>
          {stage.subtitle && <div className="mt-1 text-sm text-slate-300">{stage.subtitle}</div>}
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-200">{stage.description}</p>
        </div>
        <div className="grid gap-4 p-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-3">
            <StageBriefingMapPreview stage={stage} />
            <StageObjectiveList stage={stage} />
          </div>
          <div className="space-y-3">
            <StageThreatList stage={stage} />
            <LoadoutRecommendationPanel stage={stage} />
            <div className="rounded-lg border border-amber-500/25 bg-amber-950/20 p-3 text-xs text-amber-100">
              <div className="text-[10px] font-bold uppercase text-amber-300">Clear Reward</div>
              <div className="mt-1">{reward?.name ?? 'Campaign progress reward'}</div>
            </div>
          </div>
        </div>
        <div className="flex justify-between border-t border-slate-800 bg-slate-950/50 p-4">
          <Btn tone="ghost" onClick={() => requestTransition('MISSION_CONTROL')}>Back</Btn>
          <Btn tone="primary" onClick={() => {
            useStageProgressionStore.getState().setStatus('team-select');
            requestTransition('CHARACTER_SELECTION');
          }}>Select Team</Btn>
        </div>
      </div>
    </div>
  );
};
