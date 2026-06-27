import { useStageProgressionStore } from '../../stores/game/useStageProgressionStore';

export const StageClearBreakdown = () => {
  const score = useStageProgressionStore((state) => state.score);
  return (
    <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] text-slate-300">
      <div className="rounded border border-slate-700 p-2">Objectives: {score.objectivesCompleted}</div>
      <div className="rounded border border-slate-700 p-2">Encounters: {score.encountersCleared}</div>
      <div className="rounded border border-slate-700 p-2">Incidents: {score.incidentsResolved}</div>
      <div className="rounded border border-slate-700 p-2">Score: {score.score}</div>
    </div>
  );
};
