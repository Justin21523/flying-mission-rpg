import { usePoll } from '../usePoll';
import { flightHandle } from '../../game/flight/flightHandle';
import { getActiveRoute } from '../../game/flight/world/worldRoute';
import { getEditorLocation } from '../../stores/game/editorLocationStore';
import { useWorldFlightRuntimeStore } from '../../stores/game/worldFlightRuntimeStore';

// World-flight progress HUD (top-left): origin → destination, route progress bar, remaining virtual
// distance, altitude, speed, weather, energy/collectibles, and the current flight-event / radio call.
// Polls flightHandle (no per-frame re-render); all values come from the editable route + runtime store.
export const FlightProgressHud = () => {
  usePoll(120);
  const route = getActiveRoute();
  const energy = useWorldFlightRuntimeStore((s) => s.energy);
  const collectibles = useWorldFlightRuntimeStore((s) => s.collectibles);
  const eventLabel = useWorldFlightRuntimeStore((s) => s.activeEventLabel);
  const radio = useWorldFlightRuntimeStore((s) => s.radioText);
  const arrived = useWorldFlightRuntimeStore((s) => s.arrived);
  if (!route) return null;

  const from = getEditorLocation(route.fromLocationId)?.name ?? route.fromLocationId;
  const to = getEditorLocation(route.toLocationId)?.name ?? 'Destination';
  const u = flightHandle.routeU;
  const remaining = Math.max(0, Math.round((1 - u) * route.virtualDistance));

  return (
    <>
      <div className="pointer-events-none fixed left-3 top-3 z-[60] w-60 rounded-xl border border-sky-800/50 bg-slate-950/75 p-3 text-xs text-slate-200 backdrop-blur">
        <div className="mb-1 flex items-baseline justify-between">
          <span className="font-bold text-sky-200">WORLD FLIGHT</span>
          <span className="font-mono text-[10px] text-slate-500">{route.weather}</span>
        </div>
        <div className="mb-1 flex items-center justify-between text-[11px]">
          <span className="truncate text-amber-200">★ {from}</span>
          <span className="text-slate-500">→</span>
          <span className="truncate text-sky-200">{to}</span>
        </div>
        <div className="my-1 h-2 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400" style={{ width: `${u * 100}%` }} />
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
          <Row label="Progress" value={`${Math.round(u * 100)}%`} />
          <Row label="Remaining" value={`${remaining}`} />
          <Row label="Altitude" value={`${Math.round(flightHandle.altitude)}`} />
          <Row label="Speed" value={`${Math.round(flightHandle.speed)}`} />
          <Row label="Energy" value={`${Math.round(energy)}`} />
          <Row label="Stars" value={`${collectibles}`} />
        </div>
      </div>

      {/* current event / radio call (bottom-centre) */}
      {(eventLabel || radio) && (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-1">
          {eventLabel && (
            <div className="rounded-full bg-sky-950/85 px-4 py-1.5 text-xs font-semibold text-sky-100 backdrop-blur">⚑ {eventLabel}</div>
          )}
          {radio && (
            <div className="max-w-md rounded-lg bg-slate-950/85 px-4 py-1.5 text-center text-[11px] text-slate-200 backdrop-blur">📻 {radio}</div>
          )}
        </div>
      )}

      {arrived && (
        <div className="pointer-events-none fixed inset-x-0 top-24 z-[60] flex justify-center">
          <div className="rounded-full bg-emerald-700/85 px-5 py-2 text-sm font-bold text-emerald-50 backdrop-blur">Arrived at {to}!</div>
        </div>
      )}
    </>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between">
    <span className="text-slate-400">{label}</span>
    <span className="tabular-nums">{value}</span>
  </div>
);
