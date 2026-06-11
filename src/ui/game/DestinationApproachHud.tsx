import { useEffect } from 'react';
import { getActiveRoute } from '../../game/flight/world/worldRoute';
import { getEditorLocation } from '../../stores/game/editorLocationStore';
import { useGameStore } from '../../stores/game/useGameStore';
import { useFlightScoreStore } from '../../stores/game/flightScoreStore';

const GRADE_COLOR: Record<string, string> = { S: '#fde68a', A: '#86efac', B: '#7dd3fc', C: '#cbd5e1' };

// DESTINATION_APPROACH — arrival banner (+ a flight performance summary) + the Transform prompt.
export const DestinationApproachHud = () => {
  const route = getActiveRoute();
  const dest = route ? getEditorLocation(route.toLocationId)?.name ?? 'Destination' : 'Destination';
  const result = useFlightScoreStore((s) => s.lastResult);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.code === 'KeyT') useGameStore.getState().requestTransition('TRANSFORMATION');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="fixed inset-x-0 top-20 z-[60] flex flex-col items-center gap-2">
      <div className="pointer-events-none rounded-2xl border border-emerald-700/50 bg-slate-950/80 px-6 py-3 text-center backdrop-blur">
        <div className="text-base font-bold text-emerald-200">Approaching {dest}</div>
        <div className="mt-0.5 text-[11px] text-slate-400">Begin the transformation to descend.</div>
      </div>
      {result && (
        <div className="pointer-events-none rounded-2xl border border-amber-700/50 bg-slate-950/80 px-6 py-3 text-center backdrop-blur">
          <div className="text-[11px] uppercase tracking-wide text-slate-400">Flight Complete</div>
          <div className="mt-1 flex items-center justify-center gap-4">
            <span className="text-4xl font-black" style={{ color: GRADE_COLOR[result.grade] }}>{result.grade}</span>
            <div className="text-left text-[11px] text-slate-300">
              <div>Score <span className="font-mono text-amber-200">{result.score}</span></div>
              <div>✦ {result.collected} collected · best ×{result.bestCombo} combo</div>
            </div>
          </div>
        </div>
      )}
      <button
        onClick={() => useGameStore.getState().requestTransition('TRANSFORMATION')}
        className="pointer-events-auto rounded-full border border-fuchsia-500/60 bg-fuchsia-700/40 px-6 py-2 text-sm font-bold text-fuchsia-50 backdrop-blur hover:bg-fuchsia-600/50"
      >
        ✨ Transform (T)
      </button>
    </div>
  );
};
