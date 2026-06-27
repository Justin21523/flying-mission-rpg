import type { StageDefinition } from '../../types/stageTypes';

export const StageThreatList = ({ stage }: { stage: StageDefinition }) => {
  const threats = stage.briefing.threatSummary?.split(',').map((item) => item.trim()).filter(Boolean) ?? ['patrol drones'];
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950/55 p-3">
      <div className="text-[10px] font-bold uppercase text-rose-300">Enemy Threats</div>
      <div className="mt-2 flex flex-wrap gap-1">
        {threats.map((threat) => <span key={threat} className="rounded bg-rose-950/40 px-2 py-1 text-[11px] text-rose-100">{threat}</span>)}
      </div>
      {stage.bossEncounterId && <div className="mt-2 text-[11px] font-bold text-amber-200">Boss: {stage.bossEncounterId}</div>}
    </div>
  );
};
