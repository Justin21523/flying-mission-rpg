import { nanoid } from 'nanoid';
import { useEditorRouteStore } from '../../../stores/game/editorRouteStore';
import { useEditorLocationStore } from '../../../stores/game/editorLocationStore';
import { useEditorFlightEventStore } from '../../../stores/game/editorFlightEventStore';
import { useEditorPathStore } from '../../../stores/editorPathStore';
import { WEATHER_KINDS, FLIGHT_DIFFICULTIES, ROUTE_SEGMENT_KINDS } from '../../../types/game/flight';
import type { FlightRoute, RouteSegment } from '../../../types/game/flight';
import { FLIGHT_EVENT_KINDS } from '../../../types/game/flightEvent';
import type { FlightEventKind } from '../../../types/game/flightEvent';
import { CollectionEditor, TextRow, NumRow, SelectRow } from './CollectionEditor';
import { lbl } from '../editorShared';
import { validateRoute } from '../../../game/flight/world/worldFlightValidation';

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
