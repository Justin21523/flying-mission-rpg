import { useStageProgressionStore } from '../../stores/game/useStageProgressionStore';

export const StageClearStatsPanel = () => {
  const score = useStageProgressionStore((state) => state.score);
  const objectives = useStageProgressionStore((state) => state.completedObjectiveIds.length);
  const encounters = useStageProgressionStore((state) => state.completedEncounterIds.length);
  const incidents = useStageProgressionStore((state) => state.completedIncidentIds.length);
  const rows = [
    ['Objectives', score.objectivesCompleted || objectives],
    ['Incidents', score.incidentsResolved || incidents],
    ['Encounters', score.encountersCleared || encounters],
    ['Bosses defeated', score.bossesDefeated],
    ['Elapsed seconds', score.elapsedSeconds],
    ['Score', score.score],
  ] as const;
  return (
    <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3">
      {rows.map(([label, value]) => (
        <div key={label} className="rounded border border-slate-700 bg-slate-950/55 p-2">
          <div className="text-[10px] uppercase text-slate-500">{label}</div>
          <div className="text-lg font-black text-slate-100">{value}</div>
        </div>
      ))}
    </div>
  );
};
