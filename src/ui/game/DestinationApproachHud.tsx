import { useEffect } from 'react';
import { getActiveRoute } from '../../game/flight/world/worldRoute';
import { getEditorLocation } from '../../stores/game/editorLocationStore';
import { useGameStore } from '../../stores/game/useGameStore';

// DESTINATION_APPROACH — arrival banner + the Transform prompt (T / button) that begins the transformation.
export const DestinationApproachHud = () => {
  const route = getActiveRoute();
  const dest = route ? getEditorLocation(route.toLocationId)?.name ?? 'Destination' : 'Destination';

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
      <button
        onClick={() => useGameStore.getState().requestTransition('TRANSFORMATION')}
        className="pointer-events-auto rounded-full border border-fuchsia-500/60 bg-fuchsia-700/40 px-6 py-2 text-sm font-bold text-fuchsia-50 backdrop-blur hover:bg-fuchsia-600/50"
      >
        ✨ Transform (T)
      </button>
    </div>
  );
};
