import { nanoid } from 'nanoid';
import { WEATHER_KINDS, ROUTE_SEGMENT_KINDS } from '../../../../types/game/flight';
import type { RouteSegment } from '../../../../types/game/flight';
import { updateSegment, duplicateSegment, removeSegment } from '../../../../game/flight/world/routeSegments';
import { NumRow, SelectRow } from '../CollectionEditor';
import { lbl } from '../../editorShared';
import { KindMulti } from './EventPoolPicker';

// The route's flavour bands (0..1 along it) — type, weather, clouds, allowed events, density, altitude.
// startU/endU are clamped via updateSegment (0..1, startU < endU). Add / duplicate / remove per band.
export const SegmentList = ({ segments, onChange }: { segments: RouteSegment[]; onChange: (s: RouteSegment[]) => void }) => {
  const add = () => onChange([...segments, { id: `seg_${nanoid(5)}`, kind: 'cloud', startU: 0, endU: 0.2 }]);
  const patch = (id: string, p: Partial<RouteSegment>) => onChange(segments.map((s) => (s.id === id ? updateSegment(s, p) : s)));
  const dup = (id: string) => { const s = segments.find((x) => x.id === id); if (s) onChange([...segments, duplicateSegment(s)]); };
  const remove = (id: string) => onChange(removeSegment(segments, id));
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
            <div className="mt-1 flex gap-1.5">
              <button onClick={() => dup(s.id)} className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-200 hover:bg-slate-700">⧉ Duplicate</button>
              <button onClick={() => remove(s.id)} className="rounded bg-rose-700/20 px-2 py-0.5 text-[11px] text-rose-300 hover:bg-rose-700/30">🗑 Remove</button>
            </div>
          </div>
        ))}
        {segments.length === 0 && <div className="text-[11px] text-slate-500">No segments.</div>}
      </div>
    </div>
  );
};
