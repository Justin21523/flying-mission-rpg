import { nanoid } from 'nanoid';
import { useEditorBaseLayoutStore } from '../../../stores/game/editorBaseLayoutStore';
import { useSceneEditStore } from '../../../stores/sceneEditStore';
import { BASE_PART_KINDS, BASE_COLLISIONS } from '../../../types/game/base';
import type { BasePart } from '../../../types/game/base';
import { basePartKey } from '../../../game/base/basePartKey';
import { Field, inp, lbl, FocusButton } from '../editorShared';
import { ModelPicker } from '../ModelPicker';

// 🏗 Base — edit the home-base layout, synced with the 3D gizmo: selecting a row selects the part in 3D
// (shows the shared gizmo) and vice-versa (both driven by sceneEditStore.selectedKey). Position/rotation/
// scale show the live merged transform (gizmo moves update them); typing a number makes it the truth and
// clears the gizmo override. Model fields use the searchable ModelPicker.
const KEY_PREFIX = 'base#structure#';

const makeNew = (): BasePart => ({
  id: `base_${nanoid(6)}`,
  kind: 'wall',
  label: 'New Part',
  position: [0, 1, 0],
  rotation: [0, 0, 0],
  scale: 1,
  size: [2, 2, 2],
  color: '#64748b',
  collision: 'cuboid',
});

const num = (v: string) => parseFloat(v) || 0;

export const BaseLayoutEditorTab = () => {
  const parts = useEditorBaseLayoutStore((s) => s.items);
  const upsert = useEditorBaseLayoutStore((s) => s.upsert);
  const update = useEditorBaseLayoutStore((s) => s.update);
  const duplicate = useEditorBaseLayoutStore((s) => s.duplicate);
  const remove = useEditorBaseLayoutStore((s) => s.remove);
  const selectedKey = useSceneEditStore((s) => s.selectedKey);
  const overrides = useSceneEditStore((s) => s.overrides); // live gizmo transforms

  const selId = selectedKey && selectedKey.startsWith(KEY_PREFIX) ? selectedKey.slice(KEY_PREFIX.length) : null;
  const sel = parts.find((p) => p.id === selId) ?? null;

  const selectPart = (id: string) => useSceneEditStore.getState().requestSelect(basePartKey(id));

  // Edit a transform field: write to the data store + clear the gizmo override so the typed value wins.
  const editVec = (p: BasePart, field: 'position' | 'rotation', axis: number, v: number) => {
    const key = basePartKey(p.id);
    const live = ((overrides[key]?.[field] as [number, number, number]) ?? p[field]).slice() as [number, number, number];
    live[axis] = v;
    update(p.id, { [field]: live } as Partial<BasePart>);
    useSceneEditStore.getState().setOverride(key, { [field]: undefined });
  };
  const editScale = (p: BasePart, v: number) => {
    update(p.id, { scale: v });
    useSceneEditStore.getState().setOverride(basePartKey(p.id), { scale: undefined });
  };

  const livePos = (p: BasePart) => ((overrides[basePartKey(p.id)]?.position as [number, number, number]) ?? p.position);
  const liveRot = (p: BasePart) => ((overrides[basePartKey(p.id)]?.rotation as [number, number, number]) ?? p.rotation);
  const liveScale = (p: BasePart) => {
    const s = overrides[basePartKey(p.id)]?.scale;
    return typeof s === 'number' ? s : p.scale;
  };
  const round = (n: number) => Math.round(n * 100) / 100;

  return (
    <div className="space-y-3 text-xs">
      <div className="flex items-center justify-between">
        <div className={lbl}>Base Layout · {parts.length}</div>
        <button
          onClick={() => {
            const it = makeNew();
            upsert(it);
            selectPart(it.id);
          }}
          className="rounded bg-emerald-700/30 px-2 py-1 text-[11px] text-emerald-100 hover:bg-emerald-700/50"
        >
          ➕ Add
        </button>
      </div>

      <div className="flex gap-3">
        <div className="max-h-[60vh] w-40 shrink-0 space-y-1 overflow-y-auto pr-1">
          {parts.map((p) => (
            <button
              key={p.id}
              onClick={() => selectPart(p.id)}
              className={`block w-full truncate rounded px-2 py-1 text-left ${p.id === selId ? 'bg-violet-600/30 text-violet-100' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              {p.label} · {p.kind}
            </button>
          ))}
          {parts.length === 0 && <div className="text-slate-500">None yet.</div>}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          {sel ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[11px] font-semibold text-slate-200">{sel.label}</span>
                <FocusButton position={livePos(sel)} objKey={basePartKey(sel.id)} />
              </div>
              <Field label="Label">
                <input value={sel.label} onChange={(e) => update(sel.id, { label: e.target.value })} className={inp} />
              </Field>
              <Field label="Kind">
                <select value={sel.kind} onChange={(e) => update(sel.id, { kind: e.target.value as BasePart['kind'] })} className={inp}>
                  {BASE_PART_KINDS.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </Field>
              <Field label="Model (empty = box)">
                <ModelPicker value={sel.assetId} onChange={(v) => update(sel.id, { assetId: v })} noneLabel="(box)" />
              </Field>
              <Field label="Model target size">
                <input type="number" value={sel.modelTarget ?? 0} step={1} min={0} onChange={(e) => update(sel.id, { modelTarget: num(e.target.value) || undefined })} className={inp} />
              </Field>

              <Field label="Position (x / y / z) — live with the gizmo">
                <div className="flex gap-1">
                  {([0, 1, 2] as const).map((a) => (
                    <input key={a} type="number" step={0.5} value={round(livePos(sel)[a])} onChange={(e) => editVec(sel, 'position', a, num(e.target.value))} className={inp + ' w-0 flex-1 text-center'} />
                  ))}
                </div>
              </Field>
              <Field label="Rotation (x / y / z, rad)">
                <div className="flex gap-1">
                  {([0, 1, 2] as const).map((a) => (
                    <input key={a} type="number" step={0.1} value={round(liveRot(sel)[a])} onChange={(e) => editVec(sel, 'rotation', a, num(e.target.value))} className={inp + ' w-0 flex-1 text-center'} />
                  ))}
                </div>
              </Field>
              <Field label="Scale">
                <input type="number" step={0.1} min={0.05} value={round(liveScale(sel))} onChange={(e) => editScale(sel, num(e.target.value))} className={inp} />
              </Field>
              <Field label="Box size (x / y / z)">
                <div className="flex gap-1">
                  {([0, 1, 2] as const).map((a) => (
                    <input key={a} type="number" step={0.5} value={sel.size[a]} onChange={(e) => { const s = [...sel.size] as [number, number, number]; s[a] = num(e.target.value); update(sel.id, { size: s }); }} className={inp + ' w-0 flex-1 text-center'} />
                  ))}
                </div>
              </Field>
              <Field label="Colour">
                <input type="color" value={sel.color} onChange={(e) => update(sel.id, { color: e.target.value })} className="h-7 w-16 rounded bg-slate-800" />
              </Field>
              <Field label="Collision">
                <select value={sel.collision} onChange={(e) => update(sel.id, { collision: e.target.value as BasePart['collision'] })} className={inp}>
                  {BASE_COLLISIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </Field>

              {sel.kind === 'lift_platform' && (
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Lift depth">
                    <input type="number" step={0.5} min={0} value={sel.liftDepth ?? 12} onChange={(e) => update(sel.id, { liftDepth: num(e.target.value) })} className={inp} />
                  </Field>
                  <Field label="Lift duration (s)">
                    <input type="number" step={0.5} min={0.5} value={sel.liftDurationSec ?? 5} onChange={(e) => update(sel.id, { liftDurationSec: num(e.target.value) })} className={inp} />
                  </Field>
                </div>
              )}

              <div className="flex items-center gap-1.5 border-t border-slate-800/60 pt-2">
                <button onClick={() => { const id = duplicate(sel.id); if (id) selectPart(id); }} className="rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-700">⧉ Duplicate</button>
                <button onClick={() => remove(sel.id)} className="rounded bg-rose-700/20 px-2 py-1 text-[11px] text-rose-300 hover:bg-rose-700/30">🗑 Delete</button>
                <span className="ml-auto self-center text-[10px] text-slate-500">id: {sel.id}</span>
              </div>
              <p className="text-[10px] text-slate-500">Tip: click a part in 3D and drag the gizmo — these numbers follow (Ctrl+Z to undo).</p>
            </>
          ) : (
            <div className="text-slate-500">Select a part (here or in 3D) to edit it.</div>
          )}
        </div>
      </div>
    </div>
  );
};
