import { useEditorFlightEventStore } from '../../../../stores/game/editorFlightEventStore';
import { FLIGHT_EVENT_KINDS } from '../../../../types/game/flightEvent';
import type { FlightEventKind } from '../../../../types/game/flightEvent';
import { lbl } from '../../editorShared';

// The route's event pool — a checkbox list of authored flight events the director may spawn (empty = all).
// Shared by the 🛫 Aero World workspace (Events sub-tab). The full event-DEF authoring stays in 🌩 Events.
export const EventPoolPicker = ({ selected, onChange }: { selected: string[]; onChange: (ids: string[]) => void }) => {
  const events = useEditorFlightEventStore((s) => s.items);
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  return (
    <div>
      <div className={lbl}>Event pool {selected.length === 0 ? '(empty = all events)' : `(${selected.length})`}</div>
      <div className="mt-1 grid max-h-48 grid-cols-2 gap-x-2 gap-y-0.5 overflow-y-auto rounded bg-slate-900/60 p-1.5">
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

// A multi-select of flight-event kinds, used by a segment to restrict spawns while the craft is inside it.
export const KindMulti = ({ selected, onChange }: { selected: FlightEventKind[]; onChange: (k: FlightEventKind[]) => void }) => {
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
