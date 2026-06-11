import { nanoid } from 'nanoid';
import { useEditorFlightEventStore } from '../../../stores/game/editorFlightEventStore';
import { FLIGHT_EVENT_KINDS, FLIGHT_EVENT_MOTIONS, FLIGHT_EVENT_SPAWN_SIDES } from '../../../types/game/flightEvent';
import type { FlightEventDef, FlightEventKind } from '../../../types/game/flightEvent';
import { CollectionEditor, TextRow, NumRow, SelectRow, ColorRow, ConfidenceRow } from './CollectionEditor';
import { ModelPicker } from '../ModelPicker';
import { Field, lbl } from '../editorShared';
import { validateEvent } from '../../../game/flight/world/worldFlightValidation';

const makeNew = (): FlightEventDef => ({
  id: `fe_${nanoid(6)}`,
  kind: 'collectible',
  label: 'New Event',
  weight: 2,
  minGapSec: 4,
  lateralRange: 6,
  color: '#fde047',
  size: 2,
  durationSec: 6,
  minRouteProgress: 0,
  maxRouteProgress: 1,
  canOverlapWith: [],
  sourceConfidence: 'GameAdaptation',
});

// Checkbox grid of event kinds (for canOverlapWith).
const KindMulti = ({ label, selected, onChange }: { label: string; selected: FlightEventKind[]; onChange: (k: FlightEventKind[]) => void }) => {
  const toggle = (k: FlightEventKind) => onChange(selected.includes(k) ? selected.filter((x) => x !== k) : [...selected, k]);
  return (
    <div>
      <div className={lbl}>{label} {selected.length === 0 ? '(overlaps anything)' : `(${selected.length})`}</div>
      <div className="mt-1 grid max-h-28 grid-cols-2 gap-x-2 gap-y-0.5 overflow-y-auto rounded bg-slate-900/60 p-1.5">
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

// 🌩 Events — the world-flight event pool the director spawns from (per route, via Routes → event pool).
// Every param — including the director gating (progress/altitude windows, overlap rules, blocking, cooldown)
// — is editable + live; the running director reads the store each frame. Invalid events show errors and are
// skipped at runtime.
export const FlightEventsEditorTab = () => (
  <CollectionEditor<FlightEventDef>
    title="Flight Events"
    store={useEditorFlightEventStore}
    makeNew={makeNew}
    getLabel={(e) => `${e.label} (${e.kind})`}
    renderFields={(e, update) => {
      const errors = validateEvent(e);
      return (
        <>
          {errors.length > 0 && (
            <div className="rounded bg-rose-900/40 p-1.5 text-[11px] text-rose-200">
              {errors.map((er, i) => (<div key={i}>⚠ {er}</div>))}
            </div>
          )}
          <TextRow label="Label" value={e.label} onChange={(v) => update({ label: v })} />
          <SelectRow label="Kind" value={e.kind} options={FLIGHT_EVENT_KINDS.map((k) => ({ value: k, label: k }))} onChange={(v) => update({ kind: v as FlightEventKind })} />
          <div className="grid grid-cols-2 gap-2">
            <NumRow label="Weight" value={e.weight} step={0.5} min={0} onChange={(v) => update({ weight: v })} />
            <NumRow label="Cooldown (sec)" value={e.minGapSec} step={0.5} min={0} onChange={(v) => update({ minGapSec: v })} />
            <NumRow label="Lateral range" value={e.lateralRange} step={1} min={0} onChange={(v) => update({ lateralRange: v })} />
            <NumRow label="Size" value={e.size} step={0.5} min={0.1} onChange={(v) => update({ size: v })} />
            <NumRow label="Duration (sec)" value={e.durationSec} step={0.5} min={1} onChange={(v) => update({ durationSec: v })} />
            <NumRow label="Value" value={e.value ?? 0} step={1} onChange={(v) => update({ value: v })} />
            <NumRow label="Motion speed" value={e.driftSpeed ?? 0} step={1} min={0} onChange={(v) => update({ driftSpeed: v })} />
            <NumRow label="Glow" value={e.glow ?? 0} step={0.5} min={0} onChange={(v) => update({ glow: v || undefined })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <SelectRow label="Motion" value={e.motion ?? ''} options={[{ value: '', label: '(auto)' }, ...FLIGHT_EVENT_MOTIONS.map((m) => ({ value: m, label: m }))]} onChange={(v) => update({ motion: (v || undefined) as FlightEventDef['motion'] })} />
            <SelectRow label="Spawn side" value={e.spawnSide ?? 'either'} options={FLIGHT_EVENT_SPAWN_SIDES.map((s) => ({ value: s, label: s }))} onChange={(v) => update({ spawnSide: v as FlightEventDef['spawnSide'] })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <NumRow label="Min progress" value={e.minRouteProgress ?? 0} step={0.05} min={0} max={1} onChange={(v) => update({ minRouteProgress: v })} />
            <NumRow label="Max progress" value={e.maxRouteProgress ?? 1} step={0.05} min={0} max={1} onChange={(v) => update({ maxRouteProgress: v })} />
            <NumRow label="Min altitude" value={e.minAltitude ?? 0} step={5} onChange={(v) => update({ minAltitude: v || undefined })} />
            <NumRow label="Max altitude" value={e.maxAltitude ?? 0} step={5} onChange={(v) => update({ maxAltitude: v || undefined })} />
          </div>
          <label className="flex items-center gap-2 text-[11px] text-slate-300">
            <input type="checkbox" checked={!!e.blocking} onChange={(ev) => update({ blocking: ev.target.checked })} />
            Blocking (navigation-affecting — capped to 1 active)
          </label>
          <ColorRow label="Colour" value={e.color} onChange={(v) => update({ color: v })} />
          <Field label="Model (empty = built-in visual)">
            <ModelPicker value={e.modelAssetId} onChange={(v) => update({ modelAssetId: v })} noneLabel="(built-in)" />
          </Field>
          <KindMulti label="Can overlap with" selected={e.canOverlapWith ?? []} onChange={(k) => update({ canOverlapWith: k })} />
          <TextRow label="Radio text" value={e.radioText ?? ''} onChange={(v) => update({ radioText: v })} />
          <ConfidenceRow value={e.sourceConfidence} onChange={(v) => update({ sourceConfidence: v })} />
        </>
      );
    }}
  />
);
