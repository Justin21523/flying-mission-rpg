import type { StageDefinition } from '../../types/stageTypes';

export const StageObjectiveList = ({ stage }: { stage: StageDefinition }) => (
  <div className="rounded-lg border border-slate-700 bg-slate-950/55 p-3">
    <div className="text-[10px] font-bold uppercase text-emerald-300">Objectives</div>
    <ol className="mt-2 space-y-1 text-xs text-slate-200">
      {stage.briefing.objectives.map((objective, index) => (
        <li key={`${objective}-${index}`} className="flex gap-2">
          <span className="text-slate-500">{index + 1}.</span>
          <span>{objective}</span>
        </li>
      ))}
    </ol>
  </div>
);
