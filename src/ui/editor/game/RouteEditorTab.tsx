import { nanoid } from 'nanoid';
import { useEditorRouteStore } from '../../../stores/game/editorRouteStore';
import { useEditorLocationStore } from '../../../stores/game/editorLocationStore';
import { useEditorFlightEventStore } from '../../../stores/game/editorFlightEventStore';
import { useEditorPathStore } from '../../../stores/editorPathStore';
import { useWorldSelectStore } from '../../../stores/worldSelectStore';
import { WEATHER_KINDS, FLIGHT_DIFFICULTIES, ROUTE_SEGMENT_KINDS } from '../../../types/game/flight';
import type { FlightRoute, RouteSegment } from '../../../types/game/flight';
import { FLIGHT_EVENT_KINDS } from '../../../types/game/flightEvent';
import type { FlightEventKind } from '../../../types/game/flightEvent';
import { CollectionEditor, TextRow, NumRow, SelectRow } from './CollectionEditor';
import { Field, inp, lbl } from '../editorShared';
import { validateRoute } from '../../../game/flight/world/worldFlightValidation';
import { focusCameraOn } from '../../../game/edit/cameraFocus';
import type { PathCurveType, PathDirectionMode, PathNodeData } from '../../../types/path';

const makeNew = (): FlightRoute => ({
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

const CURVE_TYPES: PathCurveType[] = ['catmullRom', 'bezier', 'linear'];
const DIRECTIONS: PathDirectionMode[] = ['oneWay', 'twoWay'];
const num = (value: string, fallback = 0) => {
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

// The route's event pool — a checkbox list of authored flight events the director may spawn (empty = all).
const EventPoolPicker = ({ selected, onChange }: { selected: string[]; onChange: (ids: string[]) => void }) => {
  const events = useEditorFlightEventStore((s) => s.items);
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  return (
    <div>
      <div className={lbl}>Event pool {selected.length === 0 ? '(empty = all)' : `(${selected.length})`}</div>
      <div className="mt-1 grid max-h-32 grid-cols-2 gap-x-2 gap-y-0.5 overflow-y-auto rounded bg-slate-900/60 p-1.5">
        {events.map((e) => (
          <label key={e.id} className="flex items-center gap-1.5 text-[11px] text-slate-300">
            <input type="checkbox" checked={selected.includes(e.id)} onChange={() => toggle(e.id)} />
            <span className="truncate">{e.label}</span>
          </label>
        ))}
        {events.length === 0 && <span className="text-slate-500">No events yet (🌩 Events tab).</span>}
      </div>
    </div>
  );
};

const KindMulti = ({ selected, onChange }: { selected: FlightEventKind[]; onChange: (k: FlightEventKind[]) => void }) => {
  const toggle = (k: FlightEventKind) => onChange(selected.includes(k) ? selected.filter((x) => x !== k) : [...selected, k]);
  return (
    <div>
      <div className={lbl}>Allowed event kinds {selected.length === 0 ? '(inherit pool)' : `(${selected.length})`}</div>
      <div className="mt-1 grid max-h-24 grid-cols-2 gap-x-2 gap-y-0.5 overflow-y-auto rounded bg-slate-900/60 p-1.5">
        {FLIGHT_EVENT_KINDS.map((k) => (
          <label key={k} className="flex items-center gap-1.5 text-[11px] text-slate-300">
            <input type="checkbox" checked={selected.includes(k)} onChange={() => toggle(k)} />
            <span className="truncate">{k}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

// The route's flavour bands (0..1 along it) — type, weather, clouds, allowed events, density, altitude.
const SegmentList = ({ segments, onChange }: { segments: RouteSegment[]; onChange: (s: RouteSegment[]) => void }) => {
  const add = () => onChange([...segments, { id: `seg_${nanoid(5)}`, kind: 'cloud', startU: 0, endU: 0.2 }]);
  const patch = (id: string, p: Partial<RouteSegment>) => onChange(segments.map((s) => (s.id === id ? { ...s, ...p } : s)));
  const remove = (id: string) => onChange(segments.filter((s) => s.id !== id));
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className={lbl}>Segments · {segments.length}</div>
        <button onClick={add} className="rounded bg-emerald-700/30 px-2 py-0.5 text-[11px] text-emerald-100 hover:bg-emerald-700/50">➕ Segment</button>
      </div>
      <div className="mt-1 space-y-1.5">
        {segments.map((s) => (
          <div key={s.id} className="rounded bg-slate-900/60 p-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              <SelectRow label="Kind" value={s.kind} options={ROUTE_SEGMENT_KINDS.map((k) => ({ value: k, label: k }))} onChange={(v) => patch(s.id, { kind: v as RouteSegment['kind'] })} />
              <SelectRow label="Weather" value={s.weather ?? ''} options={[{ value: '', label: '(none)' }, ...WEATHER_KINDS.map((w) => ({ value: w, label: w }))]} onChange={(v) => patch(s.id, { weather: (v || undefined) as RouteSegment['weather'] })} />
              <NumRow label="Start U" value={s.startU} step={0.05} min={0} max={1} onChange={(v) => patch(s.id, { startU: v })} />
              <NumRow label="End U" value={s.endU} step={0.05} min={0} max={1} onChange={(v) => patch(s.id, { endU: v })} />
              <NumRow label="Cloud density" value={s.cloudDensity ?? 1} step={0.1} min={0} onChange={(v) => patch(s.id, { cloudDensity: v })} />
              <NumRow label="Event density" value={s.eventDensity ?? 1} step={0.1} min={0} onChange={(v) => patch(s.id, { eventDensity: v })} />
              <NumRow label="Min altitude" value={s.minAltitude ?? 0} step={5} onChange={(v) => patch(s.id, { minAltitude: v || undefined })} />
              <NumRow label="Max altitude" value={s.maxAltitude ?? 0} step={5} onChange={(v) => patch(s.id, { maxAltitude: v || undefined })} />
            </div>
            <div className="mt-1"><KindMulti selected={s.allowedEventKinds ?? []} onChange={(k) => patch(s.id, { allowedEventKinds: k })} /></div>
            <button onClick={() => remove(s.id)} className="mt-1 rounded bg-rose-700/20 px-2 py-0.5 text-[11px] text-rose-300 hover:bg-rose-700/30">🗑 Remove</button>
          </div>
        ))}
        {segments.length === 0 && <div className="text-[11px] text-slate-500">No segments.</div>}
      </div>
    </div>
  );
};

const RoutePathEditor = ({ route, update }: { route: FlightRoute; update: (patch: Partial<FlightRoute>) => void }) => {
  const paths = useEditorPathStore((s) => s.paths);
  const path = paths.find((p) => p.id === route.pathId);
  const store = useEditorPathStore.getState();
  const createPath = () => {
    const id = store.addPath('world');
    store.updatePath(id, { name: `${route.name} Path`, areaId: 'world', defaultSpeed: Math.max(1, route.virtualDistance / Math.max(1, route.estimatedFlightSec)) });
    update({ pathId: id });
  };
  const selectNode = (pathId: string, node: PathNodeData) => {
    useWorldSelectStore.getState().select(`${pathId}#node#${node.id}`);
    focusCameraOn(node.position[0], node.position[1], node.position[2]);
  };
  if (!path) {
    return (
      <div className="rounded border border-amber-700/40 bg-amber-950/15 p-2">
        <div className={lbl}>Flight path nodes</div>
        <p className="mb-1 text-[10px] text-slate-500">Create a world path to edit route control nodes in this tab and in the 3D view.</p>
        <button onClick={createPath} className="rounded bg-emerald-700/30 px-2 py-0.5 text-[11px] text-emerald-100 hover:bg-emerald-700/50">Create world path</button>
      </div>
    );
  }
  const nodes = path.nodes ?? [];
  const patchNode = (nodeId: string, patch: Partial<PathNodeData>) => store.updateNode(path.id, nodeId, patch);
  return (
    <div className="space-y-1.5 rounded border border-sky-700/40 bg-sky-950/15 p-2">
      <div className="flex items-center justify-between gap-2">
        <div className={lbl}>Flight path nodes · {nodes.length}</div>
        <button onClick={() => store.addNode(path.id)} className="rounded bg-sky-700/30 px-2 py-0.5 text-[11px] text-sky-100 hover:bg-sky-700/50">+ Node</button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <TextRow label="Path name" value={path.name} onChange={(v) => store.updatePath(path.id, { name: v })} />
        <Field label="Area">
          <input value={path.areaId ?? 'world'} onChange={(e) => store.updatePath(path.id, { areaId: e.target.value || 'world' })} className={inp} />
        </Field>
        <SelectRow label="Curve type" value={path.curveType} options={CURVE_TYPES.map((v) => ({ value: v, label: v }))} onChange={(v) => store.updatePath(path.id, { curveType: v as PathCurveType })} />
        <SelectRow label="Direction" value={path.directionMode} options={DIRECTIONS.map((v) => ({ value: v, label: v }))} onChange={(v) => store.updatePath(path.id, { directionMode: v as PathDirectionMode })} />
        <NumRow label="Default speed" value={path.defaultSpeed} step={0.5} min={0.5} onChange={(v) => store.updatePath(path.id, { defaultSpeed: v })} />
        <NumRow label="Lane width" value={path.laneWidth} step={0.5} min={0.1} onChange={(v) => store.updatePath(path.id, { laneWidth: v })} />
      </div>
      <div className="space-y-1">
        {nodes.map((node, index) => (
          <div key={node.id} className="rounded border border-slate-800 bg-slate-900/55 p-1.5">
            <div className="mb-1 flex items-center gap-1">
              <span className="w-6 text-center text-[11px] font-bold text-sky-200">{index + 1}</span>
              <button onClick={() => selectNode(path.id, node)} className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-sky-200 hover:bg-slate-700">Focus</button>
              <button onClick={() => store.removeNode(path.id, node.id)} className="ml-auto rounded bg-rose-700/20 px-2 py-0.5 text-[10px] text-rose-300 hover:bg-rose-700/30">Remove</button>
            </div>
            <Field label="Position (x / y / z) — live with the 3D node handle">
              <div className="flex gap-1">
                {([0, 1, 2] as const).map((axis) => (
                  <input
                    key={axis}
                    type="number"
                    step={0.5}
                    value={Math.round(node.position[axis] * 100) / 100}
                    onChange={(e) => {
                      const next = [...node.position] as [number, number, number];
                      next[axis] = num(e.target.value);
                      patchNode(node.id, { position: next });
                    }}
                    className={inp + ' w-0 flex-1 text-center'}
                  />
                ))}
              </div>
            </Field>
            <div className="grid grid-cols-4 gap-1.5">
              <NumRow label="Width" value={node.width} step={0.1} min={0.1} onChange={(v) => patchNode(node.id, { width: v })} />
              <NumRow label="Speed ×" value={node.speedMultiplier} step={0.1} min={0} onChange={(v) => patchNode(node.id, { speedMultiplier: v })} />
              <Field label="Tangent">
                <select value={node.tangentMode} onChange={(e) => patchNode(node.id, { tangentMode: e.target.value as PathNodeData['tangentMode'] })} className={inp}>
                  <option value="automatic">automatic</option>
                  <option value="linear">linear</option>
                  <option value="custom">custom</option>
                </select>
              </Field>
              <NumRow label="Wait (s)" value={node.waitTime ?? 0} step={0.25} min={0} onChange={(v) => patchNode(node.id, { waitTime: v || undefined })} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 🧭 Routes — base→destination flight routes. The craft follows `pathId` (a 航道 authored in 🛣 Tracks);
// the director spawns from the selected event pool; segments add flavour/event bands. All live + Edit-synced
// + resettable. Per-route sky/weather lives in the 🌦 Environment tab. Invalid routes show errors here.
export const RouteEditorTab = () => {
  const locations = useEditorLocationStore((s) => s.items);
  const paths = useEditorPathStore((s) => s.paths);
  const locOptions = [{ value: '', label: '(none)' }, ...locations.map((l) => ({ value: l.id, label: l.name }))];
  const pathOptions = [{ value: '', label: '(none)' }, ...paths.map((p) => ({ value: p.id, label: p.name }))];
  return (
    <CollectionEditor<FlightRoute>
      title="Flight Routes"
      store={useEditorRouteStore}
      makeNew={makeNew}
      getLabel={(r) => r.name}
      renderFields={(r, update) => {
        const errors = validateRoute(r);
        return (
          <>
            {errors.length > 0 && (
              <div className="rounded bg-rose-900/40 p-1.5 text-[11px] text-rose-200">
                {errors.map((er, i) => (<div key={i}>⚠ {er}</div>))}
              </div>
            )}
            <TextRow label="Name" value={r.name} onChange={(v) => update({ name: v })} />
            <SelectRow label="From" value={r.fromLocationId} options={locOptions} onChange={(v) => update({ fromLocationId: v })} />
            <SelectRow label="To" value={r.toLocationId} options={locOptions} onChange={(v) => update({ toLocationId: v })} />
            <SelectRow label="Path (航道)" value={r.pathId ?? ''} options={pathOptions} onChange={(v) => update({ pathId: v || undefined })} />
            <RoutePathEditor route={r} update={update} />
            <div className="grid grid-cols-2 gap-2">
              <NumRow label="Virtual distance" value={r.virtualDistance} step={50} onChange={(v) => update({ virtualDistance: v })} />
              <NumRow label="Est. flight (sec)" value={r.estimatedFlightSec} step={10} onChange={(v) => update({ estimatedFlightSec: v })} />
            </div>
            <SelectRow label="Weather" value={r.weather} options={WEATHER_KINDS.map((w) => ({ value: w, label: w }))} onChange={(v) => update({ weather: v as FlightRoute['weather'] })} />
            <SelectRow label="Difficulty" value={r.difficulty} options={FLIGHT_DIFFICULTIES.map((d) => ({ value: d, label: d }))} onChange={(v) => update({ difficulty: v as FlightRoute['difficulty'] })} />
            <NumRow label="Approach starts at U" value={r.approachStartU ?? 0.85} step={0.05} min={0} max={1} onChange={(v) => update({ approachStartU: v })} />
            <EventPoolPicker selected={r.eventPoolIds} onChange={(ids) => update({ eventPoolIds: ids })} />
            <SegmentList segments={r.segments ?? []} onChange={(s) => update({ segments: s })} />
          </>
        );
      }}
    />
  );
};
