import { nanoid } from 'nanoid';
import { useEditorZonePropStore } from '../../../stores/game/editorZonePropStore';
import { useEditorMissionZoneStore } from '../../../stores/game/editorMissionZoneStore';
import { useEditorZoneSegmentStore } from '../../../stores/game/editorZoneSegmentStore';
import type { ZonePropDefinition } from '../../../types/game/zoneProp';
import { CollectionEditor, TextRow, NumRow, SelectRow } from './CollectionEditor';
import { ModelPicker } from '../ModelPicker';
import { Field, inp, FocusButton } from '../editorShared';

const objKeyFor = (id: string) => `zoneprop#item#${id}`;

const Vec3Row = ({ label, value, onChange, focusKey }: { label: string; value: [number, number, number]; onChange: (v: [number, number, number]) => void; focusKey?: string }) => (
  <Field label={label}>
    <div className="flex items-center gap-1">
      {([0, 1, 2] as const).map((a) => (
        <input key={a} type="number" step={0.5} value={value[a]} onChange={(e) => { const n = [...value] as [number, number, number]; n[a] = parseFloat(e.target.value) || 0; onChange(n); }} className={inp + ' w-0 flex-1 text-center'} />
      ))}
      <FocusButton position={value} objKey={focusKey} />
    </div>
  </Field>
);

const makeNew = (): ZonePropDefinition => ({
  id: `zprop_${nanoid(6)}`,
  zoneId: '',
  modelAssetId: '',
  position: [0, 0, 0],
  scale: 1,
  enabled: true,
});

// 🌳 Zone Props — decorative GLB props placed inside the advanced mission zones (gizmo-draggable in the zone
// scene). Zone-wide unless a segmentId is set. Purely cosmetic (no collision).
export const ZonePropEditorTab = () => {
  const zones = useEditorMissionZoneStore((s) => s.items);
  const segments = useEditorZoneSegmentStore((s) => s.items);
  const none = { value: '', label: '(none)' };
  return (
    <CollectionEditor<ZonePropDefinition>
      title="Zone Props"
      store={useEditorZonePropStore}
      makeNew={makeNew}
      getLabel={(p) => p.label || p.modelAssetId.split('/').pop() || p.id}
      getFocus={(p) => ({ position: p.position, objKey: objKeyFor(p.id) })}
      renderFields={(p, update) => {
        const zoneSegments = segments.filter((s) => s.zoneId === p.zoneId);
        return (
          <>
            <TextRow label="Label" value={p.label ?? ''} onChange={(v) => update({ label: v || undefined })} />
            <SelectRow label="Zone" value={p.zoneId} options={[none, ...zones.map((z) => ({ value: z.id, label: z.name }))]} onChange={(v) => update({ zoneId: v })} />
            <SelectRow label="Segment (blank = zone-wide)" value={p.segmentId ?? ''} options={[none, ...zoneSegments.map((s) => ({ value: s.id, label: s.name }))]} onChange={(v) => update({ segmentId: v || undefined })} />
            <Field label="Model"><ModelPicker value={p.modelAssetId} onChange={(v) => update({ modelAssetId: v ?? '' })} /></Field>
            <Vec3Row label="Position (x / y / z) — gizmo-draggable" value={p.position} onChange={(v) => update({ position: v })} focusKey={objKeyFor(p.id)} />
            <div className="grid grid-cols-2 gap-2">
              <NumRow label="Facing° (Y)" value={p.rotationY ?? 0} step={10} onChange={(v) => update({ rotationY: v })} />
              <NumRow label="Scale" value={p.scale ?? 1} step={0.1} min={0.1} onChange={(v) => update({ scale: v })} />
            </div>
            <Field label="Enabled"><input type="checkbox" checked={p.enabled !== false} onChange={(e) => update({ enabled: e.target.checked })} /></Field>
          </>
        );
      }}
    />
  );
};
