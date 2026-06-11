import { useEffect } from 'react';
import { useGameStore } from '../../stores/game/useGameStore';

// HANGAR_RETURN — the craft has docked back in the hangar after the return flight. A short debrief prompt that
// hands off to the mission results screen. Enter / the button continue.
export const HangarReturnHud = () => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.code === 'Enter') useGameStore.getState().requestTransition('MISSION_RESULTS');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="fixed inset-x-0 top-24 z-[60] flex flex-col items-center gap-3">
      <div className="pointer-events-none rounded-2xl border border-sky-600/50 bg-slate-950/85 px-8 py-4 text-center backdrop-blur">
        <div className="text-xl font-bold text-sky-200">🛬 Docked at Home Base</div>
        <div className="mt-1 text-[11px] text-slate-400">Welcome back — open the mission debrief.</div>
      </div>
      <button
        onClick={() => useGameStore.getState().requestTransition('MISSION_RESULTS')}
        className="pointer-events-auto rounded-full border border-amber-500/60 bg-amber-700/40 px-6 py-2 text-sm font-bold text-amber-50 backdrop-blur hover:bg-amber-600/50"
      >
        📋 Mission results ▶ (Enter)
      </button>
    </div>
  );
};
