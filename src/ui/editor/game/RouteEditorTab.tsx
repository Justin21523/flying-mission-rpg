import { nanoid } from 'nanoid';
import { useEditorRouteStore } from '../../../stores/game/editorRouteStore';
import { useEditorLocationStore } from '../../../stores/game/editorLocationStore';
import { WEATHER_KINDS, FLIGHT_DIFFICULTIES } from '../../../types/game/flight';
import type { FlightRoute } from '../../../types/game/flight';
import { CollectionEditor, TextRow, NumRow, SelectRow } from './CollectionEditor';

const makeNew = (): FlightRoute => ({
  id: `route_${nanoid(6)}`,
  nameZhTW: '新航線',
  fromLocationId: 'loc_homebase',
  toLocationId: '',
  virtualDistance: 1000,
  estimatedFlightSec: 180,
  weather: 'clear',
  difficulty: 'easy',
  backgroundEnv: 'open_sky',
  eventPoolIds: [],
});

// 🧭 Routes — base→destination flight routes (eventPoolIds filled by the Batch 5 flight-event director).
export const RouteEditorTab = () => {
  const locations = useEditorLocationStore((s) => s.items);
  const locOptions = [
    { value: '', label: '(none)' },
    ...locations.map((l) => ({ value: l.id, label: l.nameZhTW })),
  ];
  return (
    <CollectionEditor<FlightRoute>
      title="Flight Routes"
      store={useEditorRouteStore}
      makeNew={makeNew}
      getLabel={(r) => r.nameZhTW}
      renderFields={(r, update) => (
        <>
          <TextRow label="Name (zh-TW)" value={r.nameZhTW} onChange={(v) => update({ nameZhTW: v })} />
          <SelectRow label="From" value={r.fromLocationId} options={locOptions} onChange={(v) => update({ fromLocationId: v })} />
          <SelectRow label="To" value={r.toLocationId} options={locOptions} onChange={(v) => update({ toLocationId: v })} />
          <div className="grid grid-cols-2 gap-2">
            <NumRow label="Virtual distance" value={r.virtualDistance} step={50} onChange={(v) => update({ virtualDistance: v })} />
            <NumRow label="Est. flight (sec)" value={r.estimatedFlightSec} step={10} onChange={(v) => update({ estimatedFlightSec: v })} />
          </div>
          <SelectRow label="Weather" value={r.weather} options={WEATHER_KINDS.map((w) => ({ value: w, label: w }))} onChange={(v) => update({ weather: v as FlightRoute['weather'] })} />
          <SelectRow label="Difficulty" value={r.difficulty} options={FLIGHT_DIFFICULTIES.map((d) => ({ value: d, label: d }))} onChange={(v) => update({ difficulty: v as FlightRoute['difficulty'] })} />
          <TextRow label="Background env" value={r.backgroundEnv} onChange={(v) => update({ backgroundEnv: v })} />
        </>
      )}
    />
  );
};
