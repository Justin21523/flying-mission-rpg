import type { StageDefinition } from '../../types/stageTypes';

export const StageObjectiveSummary = ({ stage }: { stage: StageDefinition }) => (
  <div className="text-[11px] leading-relaxed text-slate-400">{stage.briefing.objectives.slice(0, 3).join(' / ')}</div>
);
