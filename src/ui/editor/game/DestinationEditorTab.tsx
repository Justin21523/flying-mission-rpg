import { nanoid } from 'nanoid';
import { useEditorDestinationStore } from '../../../stores/game/editorDestinationStore';
import { useSceneEditStore } from '../../../stores/sceneEditStore';
import { DESTINATION_PART_KINDS } from '../../../types/game/destination';
import type { DestinationPart } from '../../../types/game/destination';
import { destinationPartKey } from '../../../game/destination/destinationPartKey';
import { Field, inp, lbl, Check } from '../editorShared';
import { ModelPicker } from '../ModelPicker';

// 🏙 Destination — edit the destination layout (landing/safe zones, buildings, road, mission objects,
// boundary), synced with the 3D gizmo (drag in 3D ↔ rows here). Position shows the live merged transform.
const KEY_PREFIX = 'destination#structure#';
const num = (v: string) => parseFloat(v) || 0;
const DEG = 180 / Math.PI;

const makeNew = (): DestinationPart => ({
  id: `dst_${nanoid(6)}`,
  kind: 'building',
  label: 'New Part',
  position: [0, 0, 6],
  rotation: [0, 0, 0],
  scale: 1,
  size: [4, 4, 4],
  color: '#7c8db0',
  enabled: true,
});

export const DestinationEditorTab = () => {
  const parts = useEditorDestinationStore((s) => s.items);
  const upsert = useEditorDestinationStore((s) => s.upsert);
  const update = useEditorDestinationStore((s) => s.update);
  const duplicate = useEditorDestinationStore((s) => s.duplicate);
  const remove = useEditorDestinationStore((s) => s.remove);
  const selectedKey = useSceneEditStore((s) => s.selectedKey);
  const overrides = useSceneEditStore((s) => s.overrides);

  const selId = selectedKey && selectedKey.startsWith(KEY_PREFIX) ? selectedKey.slice(KEY_PREFIX.length) : null;
  const sel = parts.find((p) => p.id === selId) ?? null;
  const selectPart = (id: string) => useSceneEditStore.getState().requestSelect(destinationPartKey(id));

  const livePos = (p: DestinationPart) => (overrides[destinationPartKey(p.id)]?.position as [number, number, number]) ?? p.position;
  const editPos = (p: DestinationPart, axis: number, v: number) => {
    const next = [...livePos(p)] as [number, number, number];
    next[axis] = v;
    update(p.id, { position: next });
    useSceneEditStore.getState().setOverride(destinationPartKey(p.id), { position: undefined });
  };
  const liveRot = (p: DestinationPart) => (overrides[destinationPartKey(p.id)]?.rotation as [number, number, number]) ?? p.rotation;
  const editRot = (p: DestinationPart, axis: number, deg: number) => {
    const next = [...liveRot(p)] as [number, number, number];
    next[axis] = deg / DEG;
    update(p.id, { rotation: next });
    useSceneEditStore.getState().setOverride(destinationPartKey(p.id), { rotation: undefined });
  };
  const round = (n: number) => Math.round(n * 100) / 100;

  return (
    <div className="space-y-3 text-xs">
      <div className="flex items-center justify-between">
        <div className={lbl}>Destination · {parts.length}</div>
        <button onClick={() => { const it = makeNew(); upsert(it); selectPart(it.id); }} className="rounded bg-emerald-700/30 px-2 py-1 text-[11px] text-emerald-100 hover:bg-emerald-700/50">➕ Add</button>
      </div>
      <div className="flex gap-3">
        <div className="max-h-[60vh] w-44 shrink-0 space-y-1 overflow-y-auto pr-1">
          {parts.map((p) => (
            <button key={p.id} onClick={() => selectPart(p.id)} className={`block w-full truncate rounded px-2 py-1 text-left ${p.id === selId ? 'bg-violet-600/30 text-violet-100' : 'text-slate-300 hover:bg-slate-800'}`}>
              {p.label} · {p.kind}
            </button>
          ))}
          {parts.length === 0 && <div className="text-slate-500">None yet.</div>}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          {sel ? (
            <>
              <Field label="Label"><input value={sel.label} onChange={(e) => update(sel.id, { label: e.target.value })} className={inp} /></Field>
              <Field label="Kind">
                <select value={sel.kind} onChange={(e) => update(sel.id, { kind: e.target.value as DestinationPart['kind'] })} className={inp}>
                  {DESTINATION_PART_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </Field>
              <Field label="Model (empty = primitive)"><ModelPicker value={sel.assetId} onChange={(v) => update(sel.id, { assetId: v })} noneLabel="(primitive)" /></Field>
              <Field label="Model target size (0 = native)"><input type="number" step={0.5} min={0} value={sel.modelTarget ?? 0} onChange={(e) => update(sel.id, { modelTarget: num(e.target.value) || undefined })} className={inp} /></Field>
              <Field label="Position (x / y / z) — live with the gizmo">
                <div className="flex gap-1">
                  {([0, 1, 2] as const).map((a) => (
                    <input key={a} type="number" step={0.5} value={round(livePos(sel)[a])} onChange={(e) => editPos(sel, a, num(e.target.value))} className={inp + ' w-0 flex-1 text-center'} />
                  ))}
                </div>
              </Field>
              <Field label="Rotation° (x / y / z)">
                <div className="flex gap-1">
                  {([0, 1, 2] as const).map((a) => (
                    <input key={a} type="number" step={5} value={Math.round(liveRot(sel)[a] * DEG)} onChange={(e) => editRot(sel, a, num(e.target.value))} className={inp + ' w-0 flex-1 text-center'} />
                  ))}
                </div>
              </Field>
              <Field label="Scale"><input type="number" step={0.1} min={0.05} value={sel.scale} onChange={(e) => update(sel.id, { scale: num(e.target.value) })} className={inp} /></Field>
              <Field label="Size (x / y / z)">
                <div className="flex gap-1">
                  {([0, 1, 2] as const).map((a) => (
                    <input key={a} type="number" step={0.5} value={sel.size[a]} onChange={(e) => { const s = [...sel.size] as [number, number, number]; s[a] = num(e.target.value); update(sel.id, { size: s }); }} className={inp + ' w-0 flex-1 text-center'} />
                  ))}
                </div>
              </Field>
              <Field label="Zone / interact radius"><input type="number" step={0.5} min={0} value={sel.radius ?? 0} onChange={(e) => update(sel.id, { radius: num(e.target.value) || undefined })} className={inp} /></Field>
              <Field label="Colour"><input type="color" value={sel.color} onChange={(e) => update(sel.id, { color: e.target.value })} className="h-7 w-16 rounded bg-slate-800" /></Field>
              <Check label="Enabled" checked={sel.enabled} onChange={(v) => update(sel.id, { enabled: v })} />
              <Field label="Linked objective id"><input value={sel.linkedObjectiveId ?? ''} onChange={(e) => update(sel.id, { linkedObjectiveId: e.target.value || undefined })} className={inp} /></Field>
              {sel.kind === 'repair_device' && (
                <Field label="Mini-game id"><input value={sel.miniGameId ?? ''} onChange={(e) => update(sel.id, { miniGameId: e.target.value || undefined })} className={inp} placeholder="repair_wiring" /></Field>
              )}
              <div className="flex items-center gap-1.5 border-t border-slate-800/60 pt-2">
                <button onClick={() => { const id = duplicate(sel.id); if (id) selectPart(id); }} className="rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-700">⧉ Duplicate</button>
                <button onClick={() => remove(sel.id)} className="rounded bg-rose-700/20 px-2 py-1 text-[11px] text-rose-300 hover:bg-rose-700/30">🗑 Delete</button>
                <span className="ml-auto self-center text-[10px] text-slate-500">id: {sel.id}</span>
              </div>
            </>
          ) : (
            <div className="text-slate-500">Select a part (here or in 3D) to edit it.</div>
          )}
        </div>
      </div>
    </div>
  );
};
