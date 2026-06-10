import { nanoid } from 'nanoid';
import { useEditorExteriorStore } from '../../../stores/game/editorExteriorStore';
import { useSceneEditStore } from '../../../stores/sceneEditStore';
import { EXTERIOR_KINDS } from '../../../types/game/exterior';
import type { ExteriorPart } from '../../../types/game/exterior';
import { exteriorPartKey } from '../../../game/flight/exteriorPartKey';
import { Field, inp, lbl } from '../editorShared';
import { ModelPicker } from '../ModelPicker';

// 🗼 Exterior — edit the base exterior + flight route (navpoints, tower, ring, sky gate, clouds, flight
// spawn), synced with the 3D gizmo (drag in 3D ↔ rows here). Position shows the live merged transform.
const KEY_PREFIX = 'exterior#structure#';
const num = (v: string) => parseFloat(v) || 0;

const makeNew = (): ExteriorPart => ({
  id: `ext_${nanoid(6)}`,
  kind: 'structure',
  label: 'New Part',
  position: [0, 20, 0],
  rotation: [0, 0, 0],
  scale: 1,
  size: [4, 4, 4],
  color: '#7c8db0',
  collision: 'none',
});

export const ExteriorEditorTab = () => {
  const parts = useEditorExteriorStore((s) => s.items);
  const upsert = useEditorExteriorStore((s) => s.upsert);
  const update = useEditorExteriorStore((s) => s.update);
  const duplicate = useEditorExteriorStore((s) => s.duplicate);
  const remove = useEditorExteriorStore((s) => s.remove);
  const selectedKey = useSceneEditStore((s) => s.selectedKey);
  const overrides = useSceneEditStore((s) => s.overrides);

  const selId = selectedKey && selectedKey.startsWith(KEY_PREFIX) ? selectedKey.slice(KEY_PREFIX.length) : null;
  const sel = parts.find((p) => p.id === selId) ?? null;
  const selectPart = (id: string) => useSceneEditStore.getState().requestSelect(exteriorPartKey(id));

  const livePos = (p: ExteriorPart) => (overrides[exteriorPartKey(p.id)]?.position as [number, number, number]) ?? p.position;
  const editPos = (p: ExteriorPart, axis: number, v: number) => {
    const next = [...livePos(p)] as [number, number, number];
    next[axis] = v;
    update(p.id, { position: next });
    useSceneEditStore.getState().setOverride(exteriorPartKey(p.id), { position: undefined });
  };
  const round = (n: number) => Math.round(n * 100) / 100;

  return (
    <div className="space-y-3 text-xs">
      <div className="flex items-center justify-between">
        <div className={lbl}>Exterior · {parts.length}</div>
        <button onClick={() => { const it = makeNew(); upsert(it); selectPart(it.id); }} className="rounded bg-emerald-700/30 px-2 py-1 text-[11px] text-emerald-100 hover:bg-emerald-700/50">➕ Add</button>
      </div>
      <div className="flex gap-3">
        <div className="max-h-[60vh] w-40 shrink-0 space-y-1 overflow-y-auto pr-1">
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
                <select value={sel.kind} onChange={(e) => update(sel.id, { kind: e.target.value as ExteriorPart['kind'] })} className={inp}>
                  {EXTERIOR_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </Field>
              {sel.kind === 'navpoint' && (
                <Field label="Navpoint order"><input type="number" step={1} value={sel.order ?? 0} onChange={(e) => update(sel.id, { order: num(e.target.value) })} className={inp} /></Field>
              )}
              <Field label="Model (empty = primitive)"><ModelPicker value={sel.assetId} onChange={(v) => update(sel.id, { assetId: v })} noneLabel="(primitive)" /></Field>
              <Field label="Position (x / y / z) — live with the gizmo">
                <div className="flex gap-1">
                  {([0, 1, 2] as const).map((a) => (
                    <input key={a} type="number" step={0.5} value={round(livePos(sel)[a])} onChange={(e) => editPos(sel, a, num(e.target.value))} className={inp + ' w-0 flex-1 text-center'} />
                  ))}
                </div>
              </Field>
              <Field label="Scale"><input type="number" step={0.1} min={0.05} value={sel.scale} onChange={(e) => update(sel.id, { scale: num(e.target.value) })} className={inp} /></Field>
              <Field label="Size / radius (x / y / z)">
                <div className="flex gap-1">
                  {([0, 1, 2] as const).map((a) => (
                    <input key={a} type="number" step={0.5} value={sel.size[a]} onChange={(e) => { const s = [...sel.size] as [number, number, number]; s[a] = num(e.target.value); update(sel.id, { size: s }); }} className={inp + ' w-0 flex-1 text-center'} />
                  ))}
                </div>
              </Field>
              <Field label="Colour"><input type="color" value={sel.color} onChange={(e) => update(sel.id, { color: e.target.value })} className="h-7 w-16 rounded bg-slate-800" /></Field>
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
