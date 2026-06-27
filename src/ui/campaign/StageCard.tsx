import type { StageDefinition } from '../../types/stageTypes';
import { Btn } from '../game/screenChrome';
import { StageDifficultyBadge } from './StageDifficultyBadge';
import { StageObjectiveSummary } from './StageObjectiveSummary';
import { StageRecommendedTeamPanel } from './StageRecommendedTeamPanel';
import { StageThemePreview } from './StageThemePreview';
import { getStageReward } from '../../stores/useStageEditorStore';

export const StageCard = ({ stage, unlocked, completed, onStart }: { stage: StageDefinition; unlocked: boolean; completed: boolean; onStart: () => void }) => {
  const reward = getStageReward(stage.rewardId);
  return (
    <div className={`rounded-lg border p-3 ${completed ? 'border-emerald-500/50 bg-emerald-950/20' : unlocked ? 'border-sky-500/50 bg-slate-950/50' : 'border-slate-800 bg-slate-950/35 opacity-70'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <StageDifficultyBadge difficulty={stage.editorMeta?.difficultyRating} />
            <div className="truncate text-sm font-bold text-slate-100">{stage.stageIndex}. {stage.name}</div>
          </div>
          <StageThemePreview stageId={stage.id} themeId={stage.environmentThemeId} />
          <div className="mt-1 text-[11px] text-slate-400">{stage.briefing.threatSummary}</div>
          <StageObjectiveSummary stage={stage} />
          <StageRecommendedTeamPanel stage={stage} />
          {reward && <div className="mt-2 text-[10px] text-amber-200">Reward: {reward.name}</div>}
        </div>
        <Btn tone={unlocked ? 'primary' : 'ghost'} disabled={!unlocked} onClick={onStart}>{completed ? 'Replay' : unlocked ? 'Briefing' : 'Locked'}</Btn>
      </div>
    </div>
  );
};
