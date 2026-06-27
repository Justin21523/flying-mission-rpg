import type { StageDefinition } from '../../types/stageTypes';

export const LoadoutRecommendationPanel = ({ stage }: { stage: StageDefinition }) => (
  <div className="rounded-lg border border-sky-500/30 bg-sky-950/25 p-3">
    <div className="text-[10px] font-bold uppercase text-sky-200">Recommended Loadout</div>
    <div className="mt-2 text-xs text-slate-200">Primary: {stage.recommendedCharacterIds.join(', ')}</div>
    <div className="mt-1 text-xs text-slate-300">Support: {stage.recommendedSupportIds?.join(', ') ?? 'any available support'}</div>
    <div className="mt-2 text-[11px] text-slate-400">Use scan, repair, shield, and break tools based on the objective prompt.</div>
  </div>
);
