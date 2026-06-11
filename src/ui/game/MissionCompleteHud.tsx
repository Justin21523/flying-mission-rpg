import { useEffect } from 'react';
import { useMissionStore } from '../../stores/game/useMissionStore';
import { getEditorMission } from '../../stores/game/editorMissionStore';
import { useGameStore } from '../../stores/game/useGameStore';

// MISSION_COMPLETE — celebration banner + the start of the return loop (reverse transform → return flight →
// base approach → hangar dock → results). Enter / the button begins the return.
export const MissionCompleteHud = () => {
  const missionId = useMissionStore((s) => s.currentMissionId);
  const mission = missionId ? getEditorMission(missionId) : undefined;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.code === 'Enter') useGameStore.getState().requestTransition('RETURN_TRANSFORMATION');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="fixed inset-x-0 top-24 z-[60] flex flex-col items-center gap-3">
      <div className="pointer-events-none rounded-2xl border border-emerald-500/60 bg-slate-950/85 px-8 py-4 text-center backdrop-blur">
        <div className="text-2xl font-bold text-emerald-200">🎉 Mission Complete!</div>
        {mission && <div className="mt-1 text-sm text-slate-300">{mission.name}</div>}
        <div className="mt-1 text-[11px] text-slate-500">Transform back and fly home for the debrief.</div>
      </div>
      <button
        onClick={() => useGameStore.getState().requestTransition('RETURN_TRANSFORMATION')}
        className="pointer-events-auto rounded-full border border-sky-500/60 bg-sky-700/40 px-6 py-2 text-sm font-bold text-sky-50 backdrop-blur hover:bg-sky-600/50"
      >
        🏠 Return home ▶ (Enter)
      </button>
    </div>
  );
};
