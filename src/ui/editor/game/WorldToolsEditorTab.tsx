import { useState } from 'react';
import { nanoid } from 'nanoid';
import { useEditorRouteStore } from '../../../stores/game/editorRouteStore';
import { useFlightStore } from '../../../stores/game/useFlightStore';
import { useGameStore } from '../../../stores/game/useGameStore';
import type { FlightRoute } from '../../../types/game/flight';
import { Field, inp, lbl } from '../editorShared';
import { RouteFields } from './worldTools/RouteFields';
import { PathNodeList } from './worldTools/PathNodeList';
import { SegmentList } from './worldTools/SegmentList';
import { EventPoolPicker } from './worldTools/EventPoolPicker';
import { RouteEnvironmentFields } from './worldTools/RouteEnvironmentFields';
import { LocationPreview } from './worldTools/LocationPreview';

// 🛫 Aero World — one workspace for WORLD_FLIGHT route authoring: pick a route, make it the ACTIVE flight
// route (so RouteFollower / HUD / event director / preview all use it live), then edit it across sub-tabs:
// Route fields · Path nodes (draggable in 3D) · Segments · Event pool · Environment · Locations (focus).
// Everything reads/writes the existing editorRouteStore + editorPathStore (persisted + project-exportable).
const makeNewRoute = (): FlightRoute => ({
  id: `route_${nanoid(6)}`,
  name: 'New Route',
  fromLocationId: 'loc_homebase',
  toLocationId: '',
  virtualDistance: 1000,
  estimatedFlightSec: 180,
  weather: 'clear',
  difficulty: 'easy',
  backgroundEnv: 'open_sky',
  eventPoolIds: [],
  pathId: '',
  segments: [{ id: `seg_${nanoid(5)}`, kind: 'approach', startU: 0.85, endU: 1 }],
});

type Sub = 'route' | 'nodes' | 'segments' | 'events' | 'environment' | 'locations';
const SUBS: { id: Sub; label: string }[] = [
  { id: 'route', label: 'Route' },
  { id: 'nodes', label: 'Path Nodes' },
  { id: 'segments', label: 'Segments' },
  { id: 'events', label: 'Events' },
  { id: 'environment', label: 'Environment' },
  { id: 'locations', label: 'Locations' },
];

export const WorldToolsEditorTab = () => {
  const routes = useEditorRouteStore((s) => s.items);
  const upsert = useEditorRouteStore((s) => s.upsert);
  const updateRoute = useEditorRouteStore((s) => s.update);
  const duplicate = useEditorRouteStore((s) => s.duplicate);
  const remove = useEditorRouteStore((s) => s.remove);
  const activeRouteId = useFlightStore((s) => s.currentRouteId);
  const routeProgress = useFlightStore((s) => s.progress);
  const phase = useGameStore((s) => s.phase);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sub, setSub] = useState<Sub>('route');

  const route = routes.find((r) => r.id === selectedId) ?? routes[0] ?? null;
  const update = (patch: Partial<FlightRoute>) => { if (route) updateRoute(route.id, patch); };
  const makeActive = () => { if (route) useFlightStore.getState().setRoute(route.id); };
  const jumpToWorldFlight = () => {
    if (!route) return;
    useFlightStore.getState().setRoute(route.id);
    useFlightStore.getState().setProgress(0);
    useGameStore.getState().jumpTo('WORLD_FLIGHT');
  };
  const setRouteProgress = (value: number) => useFlightStore.getState().setProgress(Number.isFinite(value) ? value : 0);

  return (
    <div className="space-y-3 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <div className={lbl}>Aero World · {routes.length} routes</div>
        <button onClick={() => { const it = makeNewRoute(); upsert(it); setSelectedId(it.id); }} className="rounded bg-emerald-700/30 px-2 py-1 text-[11px] text-emerald-100 hover:bg-emerald-700/50">➕ Route</button>
        {route && <button onClick={() => { const id = duplicate(route.id); if (id) setSelectedId(id); }} className="rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-700">⧉ Duplicate</button>}
        {route && <button onClick={() => { remove(route.id); setSelectedId(null); }} className="rounded bg-rose-700/20 px-2 py-1 text-[11px] text-rose-300 hover:bg-rose-700/30">🗑 Delete</button>}
      </div>

      {route ? (
        <>
          <div className="flex flex-wrap items-center gap-2 rounded bg-slate-900/60 p-2">
            <select value={route.id} onChange={(e) => setSelectedId(e.target.value)} className="rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-100">
              {routes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            {activeRouteId === route.id ? (
              <span className="rounded-full bg-emerald-700/40 px-2 py-1 text-[10px] font-semibold text-emerald-100">● Active flight route</span>
            ) : (
              <button onClick={makeActive} className="rounded bg-sky-700/40 px-2 py-1 text-[11px] text-sky-100 hover:bg-sky-700/60">▶ Make active</button>
            )}
            {activeRouteId && activeRouteId !== route.id && (
              <span className="text-[10px] text-slate-500">active: {routes.find((r) => r.id === activeRouteId)?.name ?? activeRouteId}</span>
            )}
            <button onClick={jumpToWorldFlight} className="rounded bg-violet-700/40 px-2 py-1 text-[11px] text-violet-100 hover:bg-violet-700/60">Edit in WORLD_FLIGHT</button>
            <span className="ml-auto text-[10px] text-slate-500">phase: {phase}</span>
          </div>

          <div className="rounded border border-sky-800/40 bg-sky-950/10 p-2">
            <Field label="Active route test progress">
              <div className="flex items-center gap-2">
                <input type="range" min={0} max={1} step={0.01} value={routeProgress} onChange={(e) => setRouteProgress(parseFloat(e.target.value))} className="min-w-0 flex-1" />
                <input type="number" min={0} max={1} step={0.01} value={routeProgress.toFixed(2)} onChange={(e) => setRouteProgress(parseFloat(e.target.value))} className={`${inp} w-20 text-right`} />
                <button onClick={() => setRouteProgress(0)} className="rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-700">Reset</button>
              </div>
            </Field>
          </div>

          <div className="flex flex-wrap gap-1">
            {SUBS.map((s) => (
              <button key={s.id} onClick={() => setSub(s.id)} className={`rounded px-2 py-0.5 text-[11px] font-semibold ${sub === s.id ? 'bg-violet-600/30 text-violet-100' : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'}`}>{s.label}</button>
            ))}
          </div>

          <div className="space-y-2">
            {sub === 'route' && <RouteFields route={route} update={update} />}
            {sub === 'nodes' && <PathNodeList route={route} update={update} />}
            {sub === 'segments' && <SegmentList segments={route.segments ?? []} onChange={(s) => update({ segments: s })} />}
            {sub === 'events' && <EventPoolPicker selected={route.eventPoolIds} onChange={(ids) => update({ eventPoolIds: ids })} />}
            {sub === 'environment' && <RouteEnvironmentFields route={route} update={update} />}
            {sub === 'locations' && <LocationPreview route={route} />}
          </div>

          <p className="text-[10px] text-slate-500">Jump to WORLD_FLIGHT (Game-State console) to drag path nodes in 3D. Edits hit the active route live.</p>
        </>
      ) : (
        <div className="text-slate-500">No routes yet — add one above.</div>
      )}
    </div>
  );
};
