import type { StageDefinition } from '../../types/stageTypes';

export const RecommendedLoadoutPreview = ({ stage }: { stage: StageDefinition }) => (
  <div className="mt-2 grid gap-1 text-[10px] text-slate-300">
    <div><span className="font-bold text-sky-200">Team:</span> {stage.recommendedCharacterIds.join(', ')}</div>
    <div><span className="font-bold text-cyan-200">Support:</span> {stage.recommendedSupportIds?.join(', ') ?? 'flex'}</div>
  </div>
);
