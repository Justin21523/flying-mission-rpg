import { useMissionStore } from '../../stores/game/useMissionStore';
import { getEditorMission } from '../../stores/game/editorMissionStore';

// MISSION_COMPLETE — celebration banner (the return flight + results screen are Batches 9/results).
export const MissionCompleteHud = () => {
  const missionId = useMissionStore((s) => s.currentMissionId);
  const mission = missionId ? getEditorMission(missionId) : undefined;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-24 z-[60] flex flex-col items-center gap-2">
      <div className="rounded-2xl border border-emerald-500/60 bg-slate-950/85 px-8 py-4 text-center backdrop-blur">
        <div className="text-2xl font-bold text-emerald-200">🎉 Mission Complete!</div>
        {mission && <div className="mt-1 text-sm text-slate-300">{mission.name}</div>}
        <div className="mt-1 text-[11px] text-slate-500">Return flight home arrives in a later batch — explore the harbor!</div>
      </div>
    </div>
  );
};
