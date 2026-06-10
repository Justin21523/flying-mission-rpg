import { nanoid } from 'nanoid';
import { useEditorFlightEventStore } from '../../../stores/game/editorFlightEventStore';
import { FLIGHT_EVENT_KINDS } from '../../../types/game/flightEvent';
import type { FlightEventDef } from '../../../types/game/flightEvent';
import { CollectionEditor, TextRow, NumRow, SelectRow, ColorRow, ConfidenceRow } from './CollectionEditor';
import { ModelPicker } from '../ModelPicker';
import { Field } from '../editorShared';

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
  sourceConfidence: 'GameAdaptation',
});

// 🌩 Events — the world-flight event pool the director spawns from (per route, via Routes → event pool).
// Every param is editable + live; the running director reads the store each frame.
export const FlightEventsEditorTab = () => (
  <CollectionEditor<FlightEventDef>
    title="Flight Events"
    store={useEditorFlightEventStore}
    makeNew={makeNew}
    getLabel={(e) => `${e.label} (${e.kind})`}
    renderFields={(e, update) => (
      <>
        <TextRow label="Label" value={e.label} onChange={(v) => update({ label: v })} />
        <SelectRow label="Kind" value={e.kind} options={FLIGHT_EVENT_KINDS.map((k) => ({ value: k, label: k }))} onChange={(v) => update({ kind: v as FlightEventDef['kind'] })} />
        <div className="grid grid-cols-2 gap-2">
          <NumRow label="Weight" value={e.weight} step={0.5} min={0} onChange={(v) => update({ weight: v })} />
          <NumRow label="Min gap (sec)" value={e.minGapSec} step={0.5} min={0} onChange={(v) => update({ minGapSec: v })} />
          <NumRow label="Lateral range" value={e.lateralRange} step={1} min={0} onChange={(v) => update({ lateralRange: v })} />
          <NumRow label="Size" value={e.size} step={0.5} min={0.1} onChange={(v) => update({ size: v })} />
          <NumRow label="Duration (sec)" value={e.durationSec} step={0.5} min={1} onChange={(v) => update({ durationSec: v })} />
          <NumRow label="Value" value={e.value ?? 0} step={1} onChange={(v) => update({ value: v })} />
          <NumRow label="Drift speed" value={e.driftSpeed ?? 0} step={1} min={0} onChange={(v) => update({ driftSpeed: v })} />
        </div>
        <ColorRow label="Colour" value={e.color} onChange={(v) => update({ color: v })} />
        <Field label="Model (empty = built-in visual)">
          <ModelPicker value={e.modelAssetId} onChange={(v) => update({ modelAssetId: v })} noneLabel="(built-in)" />
        </Field>
        <TextRow label="Radio text" value={e.radioText ?? ''} onChange={(v) => update({ radioText: v })} />
        <ConfidenceRow value={e.sourceConfidence} onChange={(v) => update({ sourceConfidence: v })} />
      </>
    )}
  />
);
