import type { ReactNode } from 'react';
import { usePoll } from '../usePoll';
import { flightHandle } from '../../game/flight/flightHandle';
import { flightDirectorDebug, ACTIVE_FLIGHT_EVENTS, clearActiveFlightEvents } from '../../game/flight/world/flightEventRuntime';
import { useWorldFlightRuntimeStore } from '../../stores/game/worldFlightRuntimeStore';
import { getActiveRoute } from '../../game/flight/world/worldRoute';
import { devAddProgress, devJumpU } from '../../game/flight/world/worldFlightDev';

// Dev/edit-only world-flight inspector (PDF §批次5 §16). Shows route/progress/segment, active events +
// lifecycle states, per-event cooldowns, the last rejected spawn reason, and the energy/collectible runtime;
// with quick controls (advance progress, jump to approach, clear/regenerate events). Polls (no per-frame
// re-render). Clouds/streaks are fixed instanced pools (flat object count by construction).
export const WorldFlightDebugPanel = () => {
  usePoll(250);
  const rt = useWorldFlightRuntimeStore();
  const route = getActiveRoute();
  const approachU = route?.approachStartU ?? 0.85;

  return (
    <div className="pointer-events-auto fixed bottom-2 left-2 z-[90] w-72 rounded-lg border border-sky-800/60 bg-slate-950/85 p-3 text-[11px] text-slate-200 shadow-xl backdrop-blur">
      <div className="mb-1 font-bold text-sky-300">🛰 World Flight (dev)</div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        <Row label="Route" value={flightDirectorDebug.routeId || '—'} />
        <Row label="Segment" value={flightDirectorDebug.segmentId || '—'} />
        <Row label="Progress" value={`${Math.round(flightHandle.routeU * 100)}%`} />
        <Row label="Altitude" value={`${Math.round(flightHandle.altitude)}`} />
        <Row label="Active events" value={`${ACTIVE_FLIGHT_EVENTS.length}`} />
        <Row label="Energy" value={`${Math.round(rt.energy)}`} />
        <Row label="Stars" value={`${rt.collectibles}`} />
        <Row label="Clouds" value="instanced (flat)" />
      </div>

      {flightDirectorDebug.lastRejected && (
        <div className="mt-1 rounded bg-amber-900/30 px-1.5 py-0.5 text-[10px] text-amber-200">rejected: {flightDirectorDebug.lastRejected}</div>
      )}

      <div className="mt-1 max-h-20 overflow-y-auto rounded bg-slate-900/60 p-1 text-[10px]">
        {ACTIVE_FLIGHT_EVENTS.length === 0 && <div className="text-slate-500">no active events</div>}
        {ACTIVE_FLIGHT_EVENTS.map((e) => (
          <div key={e.id} className="flex justify-between">
            <span className="truncate" style={{ color: e.def.color }}>{e.def.kind}</span>
            <span className="text-slate-400">{e.state}</span>
          </div>
        ))}
      </div>

      {flightDirectorDebug.cooldowns.length > 0 && (
        <div className="mt-1 text-[10px] text-slate-400">
          cooldowns: {flightDirectorDebug.cooldowns.map((c) => `${c.id.replace('fe_', '')} ${c.remaining.toFixed(1)}s`).join(' · ')}
        </div>
      )}

      <div className="mt-2 flex flex-wrap gap-1">
        <Btn onClick={() => devAddProgress(0.1)}>+10%</Btn>
        <Btn onClick={() => devJumpU(approachU)}>→ approach</Btn>
        <Btn onClick={() => clearActiveFlightEvents()}>clear events</Btn>
        <Btn onClick={() => clearActiveFlightEvents()}>regen</Btn>
      </div>
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between"><span className="text-slate-400">{label}</span><span className="tabular-nums truncate">{value}</span></div>
);
const Btn = ({ onClick, children }: { onClick: () => void; children: ReactNode }) => (
  <button onClick={onClick} className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-200 hover:bg-slate-700">{children}</button>
);
