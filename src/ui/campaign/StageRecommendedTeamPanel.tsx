import type { StageDefinition } from '../../types/stageTypes';

export const StageRecommendedTeamPanel = ({ stage }: { stage: StageDefinition }) => (
  <div className="mt-2 flex flex-wrap gap-1">
    {stage.recommendedCharacterIds.map((id) => <span key={id} className="rounded border border-slate-700 px-1.5 py-0.5 text-[10px] text-slate-300">{id.replace('char_', '')}</span>)}
  </div>
);
