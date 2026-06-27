import { useStageContentPackStore } from '../../../stores/useStageContentEditorStore';

export const StagePacingEditorTab = () => {
  const packs = useStageContentPackStore((state) => state.items);
  return (
    <div className="space-y-2 text-xs text-slate-300">
      <h2 className="text-sm font-bold text-sky-200">Stage Pacing</h2>
      {packs.map((pack) => (
        <div key={pack.id} className="rounded border border-slate-700 bg-slate-950/50 p-3">
          <div className="font-bold text-slate-100">{pack.stageId} · {pack.pacing.pacingType} · {pack.pacing.expectedDurationMinutes}m</div>
          <div className="mt-2 grid gap-1">
            {pack.pacing.beats.map((beat) => <div key={beat.id} className="rounded bg-slate-900 px-2 py-1">{beat.segmentId}: {beat.beatType} · I{beat.targetIntensity}</div>)}
          </div>
        </div>
      ))}
    </div>
  );
};
