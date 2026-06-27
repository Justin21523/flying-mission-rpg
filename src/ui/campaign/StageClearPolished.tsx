import { useGameStore } from '../../stores/game/useGameStore';
import { useStageProgressionStore } from '../../stores/game/useStageProgressionStore';
import { getStageDefinition } from '../../stores/useStageEditorStore';
import { getStagePolishPreset } from '../../stores/useStageContentEditorStore';
import { Btn, panel } from '../game/screenChrome';
import { StageClearStatsPanel } from './StageClearStatsPanel';
import { StageRewardUnlockPanel } from './StageRewardUnlockPanel';
import { NextStageUnlockedPanel } from './NextStageUnlockedPanel';
import { CampaignProgressSummary } from './CampaignProgressSummary';

export const StageClearPolished = () => {
  const stageId = useStageProgressionStore((state) => state.activeStageId);
  const stage = stageId ? getStageDefinition(stageId) : undefined;
  const requestTransition = useGameStore((state) => state.requestTransition);
  if (!stage) return null;
  const polish = getStagePolishPreset(stage.id);
  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className={`w-[min(94vw,46rem)] ${panel} p-5 text-slate-100`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-sm font-bold text-emerald-200">Stage Clear</div>
            <h2 className="mt-1 text-3xl font-black">{polish?.clearTitle ?? stage.name}</h2>
            <p className="mt-2 text-sm text-slate-300">{polish?.clearSubtitle ?? 'Objectives complete. Rewards are ready at debrief.'}</p>
          </div>
          <CampaignProgressSummary />
        </div>
        <StageClearStatsPanel />
        <StageRewardUnlockPanel stage={stage} />
        <NextStageUnlockedPanel stage={stage} />
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Btn tone="ghost" onClick={() => {
            useStageProgressionStore.getState().setStatus('returning-to-base');
            requestTransition('MISSION_CONTROL');
          }}>Return to Campaign</Btn>
          <Btn tone="primary" onClick={() => useStageProgressionStore.getState().setStatus('returning-to-base')}>Continue Return</Btn>
        </div>
      </div>
    </div>
  );
};
