import { getActiveRoute } from '../../game/flight/world/worldRoute';
import { getEditorLocation } from '../../stores/game/editorLocationStore';

// Minimal DESTINATION_APPROACH banner (full approach/landing UI is Batch 7).
export const DestinationApproachHud = () => {
  const route = getActiveRoute();
  const dest = route ? getEditorLocation(route.toLocationId)?.name ?? 'Destination' : 'Destination';
  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-[60] flex justify-center">
      <div className="rounded-2xl border border-emerald-700/50 bg-slate-950/80 px-6 py-3 text-center backdrop-blur">
        <div className="text-base font-bold text-emerald-200">Approaching {dest}</div>
        <div className="mt-0.5 text-[11px] text-slate-400">Descent &amp; landing arrive in a later batch — orbit to look around.</div>
      </div>
    </div>
  );
};
