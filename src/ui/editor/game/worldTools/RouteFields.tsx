import { useEditorLocationStore } from '../../../../stores/game/editorLocationStore';
import { useEditorPathStore } from '../../../../stores/editorPathStore';
import { WEATHER_KINDS, FLIGHT_DIFFICULTIES } from '../../../../types/game/flight';
import type { FlightRoute } from '../../../../types/game/flight';
import { validateRoute } from '../../../../game/flight/world/worldFlightValidation';
import { TextRow, NumRow, SelectRow } from '../CollectionEditor';

// Core route fields (name, from/to location dropdowns, 航道 dropdown, distances, weather, difficulty,
// approach point) + inline validation. Per-route environment lives in the Environment sub-tab; path nodes,
// segments and the event pool in their own sub-tabs.
export const RouteFields = ({ route, update }: { route: FlightRoute; update: (patch: Partial<FlightRoute>) => void }) => {
  const locations = useEditorLocationStore((s) => s.items);
  const paths = useEditorPathStore((s) => s.paths);
  const locOptions = [{ value: '', label: '(none)' }, ...locations.map((l) => ({ value: l.id, label: l.name }))];
  const pathOptions = [{ value: '', label: '(none)' }, ...paths.map((p) => ({ value: p.id, label: `${p.name} · ${p.areaId ?? 'world'}` }))];
  const errors = validateRoute(route);
  return (
    <>
      {errors.length > 0 && (
        <div className="rounded bg-rose-900/40 p-1.5 text-[11px] text-rose-200">
          {errors.map((er, i) => (<div key={i}>⚠ {er}</div>))}
        </div>
      )}
      <TextRow label="Name" value={route.name} onChange={(v) => update({ name: v })} />
      <SelectRow label="From" value={route.fromLocationId} options={locOptions} onChange={(v) => update({ fromLocationId: v })} />
      <SelectRow label="To" value={route.toLocationId} options={locOptions} onChange={(v) => update({ toLocationId: v })} />
      <SelectRow label="Path (航道)" value={route.pathId ?? ''} options={pathOptions} onChange={(v) => update({ pathId: v || undefined })} />
      <div className="grid grid-cols-2 gap-2">
        <NumRow label="Virtual distance" value={route.virtualDistance} step={50} onChange={(v) => update({ virtualDistance: v })} />
        <NumRow label="Est. flight (sec)" value={route.estimatedFlightSec} step={10} onChange={(v) => update({ estimatedFlightSec: v })} />
      </div>
      <SelectRow label="Weather" value={route.weather} options={WEATHER_KINDS.map((w) => ({ value: w, label: w }))} onChange={(v) => update({ weather: v as FlightRoute['weather'] })} />
      <SelectRow label="Difficulty" value={route.difficulty} options={FLIGHT_DIFFICULTIES.map((d) => ({ value: d, label: d }))} onChange={(v) => update({ difficulty: v as FlightRoute['difficulty'] })} />
      <NumRow label="Approach starts at U" value={route.approachStartU ?? 0.85} step={0.05} min={0} max={1} onChange={(v) => update({ approachStartU: v })} />
    </>
  );
};
