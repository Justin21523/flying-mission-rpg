import type { StageDefinition } from '../../types/stageTypes';
import { Btn } from '../game/screenChrome';
import { StageDifficultyBadge } from './StageDifficultyBadge';
import { StageThemePreview } from './StageThemePreview';
import { StageCompletionBadge } from './StageCompletionBadge';
import { StageThreatPreview } from './StageThreatPreview';
import { StageRewardPreview } from './StageRewardPreview';
import { RecommendedLoadoutPreview } from './RecommendedLoadoutPreview';

export const StageNodeCard = ({
  stage,
  unlocked,
  completed,
  demoRecommended,
  onStart,
}: {
  stage: StageDefinition;
  unlocked: boolean;
  completed: boolean;
  demoRecommended?: boolean;
  onStart: () => void;
}) => (
  <article className={`rounded-lg border p-3 shadow-xl ${completed ? 'border-emerald-500/50 bg-emerald-950/20' : unlocked ? 'border-sky-500/50 bg-slate-950/70' : 'border-slate-800 bg-slate-950/45 opacity-75'}`}>
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <StageDifficultyBadge difficulty={stage.editorMeta?.difficultyRating} />
          <StageCompletionBadge unlocked={unlocked} completed={completed} />
          {demoRecommended && <span className="rounded bg-fuchsia-600/25 px-2 py-0.5 text-[10px] font-bold text-fuchsia-100">Demo</span>}
        </div>
        <h3 className="mt-2 truncate text-sm font-black text-slate-100">{stage.stageIndex}. {stage.name}</h3>
        <StageThemePreview stageId={stage.id} themeId={stage.environmentThemeId} />
        <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-slate-300">{stage.description}</p>
        <StageThreatPreview stage={stage} />
        <RecommendedLoadoutPreview stage={stage} />
        <StageRewardPreview stage={stage} />
      </div>
      <Btn tone={unlocked ? 'primary' : 'ghost'} disabled={!unlocked} onClick={onStart}>{completed ? 'Replay' : unlocked ? 'Briefing' : 'Locked'}</Btn>
    </div>
  </article>
);
