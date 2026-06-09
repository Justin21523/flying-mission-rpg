import { useEditorPortalStore } from '../../stores/editorPortalStore';
import { usePlayerStore } from '../../stores/playerStore';
import { useSceneEditStore } from '../../stores/sceneEditStore';
import { useWorldSelectStore } from '../../stores/worldSelectStore';
import { objKey } from '../../game/edit/sceneEditMerge';
import { PORTAL_ACTIVATIONS, type PortalActivation, type PortalDef } from '../../types/portal';
import { Field, inp, lbl, Check, useAreaOptions } from './editorShared';
import { ModelPicker } from './ModelPicker';

// 🚪 Portals tab — place doors/portals in the current area. A portal has an ENTRY (its own position, orange)
// and an EXIT (where you land after teleport, a green marker in the target area) — both gizmo-movable, numbers
// follow live. Auto-saves.
export const PortalEditorTab = () => {
  const areaId = usePlayerStore((s) => s.currentAreaId);
  const all = useEditorPortalStore((s) => s.portals);
  const overrides = useSceneEditStore((s) => s.overrides); // live gizmo positions
  const st = useEditorPortalStore.getState();
  const portals = all.filter((p) => p.areaId === areaId);
  const areaOptions = useAreaOptions();

  const set = (id: string, patch: Partial<PortalDef>) => st.updatePortal(id, patch);

  return (
    <div className="space-y-3 text-xs">
      <div className="flex items-center justify-between rounded-lg border border-slate-700/60 bg-slate-900/40 px-2 py-1.5">
        <span className={lbl}>🚪 Portals in “{areaId}” ({portals.length})</span>
        <button onClick={() => st.addPortal(areaId)} className="rounded bg-emerald-700/30 px-2 py-0.5 text-[11px] text-emerald-100 hover:bg-emerald-700/50">➕ at cam</button>
      </div>
      {portals.length === 0 && <div className="text-[11px] text-slate-500">No portals here. Add one at the camera focus, then drag its gizmo in 3D. Set its target to a building/HQ interior area (create those in the 🗺 World tab).</div>}

      {portals.map((p) => {
        const livePos = (overrides[objKey(areaId, 'landmark', p.id)]?.position ?? p.position) as [number, number, number];
        return (
          <div key={p.id} className="space-y-1.5 rounded-lg border border-slate-700/60 bg-slate-900/40 p-2">
            <div className="flex items-center gap-1.5">
              <input type="color" value={p.color ?? '#f97316'} onChange={(e) => set(p.id, { color: e.target.value })} className="h-6 w-7 shrink-0 rounded bg-slate-800" />
              <input value={p.name} onChange={(e) => set(p.id, { name: e.target.value })} className={inp + ' flex-1'} placeholder="portal name" />
              <button onClick={() => useSceneEditStore.getState().requestSelect(objKey(areaId, 'landmark', p.id))} title="Select gizmo in 3D" className="rounded px-1 text-[11px] text-sky-300 hover:bg-slate-800">🎯</button>
              <button onClick={() => st.removePortal(p.id)} className="rounded px-1 text-[11px] text-rose-400 hover:bg-slate-800">🗑</button>
            </div>

            <Field label="position (x / y / z) — live with the gizmo">
              <div className="flex gap-1">
                {([0, 1, 2] as const).map((a) => (
                  <input key={a} type="number" step={0.5} value={Math.round(livePos[a] * 100) / 100} className={inp + ' w-0 flex-1'} onChange={(e) => {
                    const next = [...livePos] as [number, number, number];
                    next[a] = parseFloat(e.target.value) || 0;
                    set(p.id, { position: next });
                    useSceneEditStore.getState().setOverride(objKey(areaId, 'landmark', p.id), { position: undefined });
                  }} />
                ))}
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-2">
              <Field label="activation">
                <select value={p.activation} onChange={(e) => set(p.id, { activation: e.target.value as PortalActivation })} className={inp}>
                  {PORTAL_ACTIVATIONS.map((a) => <option key={a} value={a}>{a === 'proximity' ? 'walk in (proximity)' : 'press [E] (interact)'}</option>)}
                </select>
              </Field>
              <Field label="radius"><input type="number" step={0.5} min={0.5} value={p.radius ?? 2.5} onChange={(e) => set(p.id, { radius: parseFloat(e.target.value) || 0.5 })} className={inp} /></Field>
              <Field label="rotation (rad)"><input type="number" step={0.1} value={p.rotation ?? 0} onChange={(e) => set(p.id, { rotation: parseFloat(e.target.value) || 0 })} className={inp} /></Field>
              <Field label="model (empty = arch stub)"><ModelPicker value={p.modelAssetId || undefined} onChange={(v) => set(p.id, { modelAssetId: v ?? undefined })} allowNone noneLabel="(arch stub)" /></Field>
            </div>

            <div className="rounded border border-slate-700/50 bg-slate-900/50 p-1.5">
              <div className={lbl}>Teleport destination</div>
              <Field label="target area (where the exit is)">
                <select value={p.targetAreaId} onChange={(e) => set(p.id, { targetAreaId: e.target.value })} className={inp}>
                  {areaOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              </Field>
              <Field label="exit position (x / y / z) — where you land">
                <div className="flex gap-1">
                  {([0, 1, 2] as const).map((a) => (
                    <input key={a} type="number" step={0.5} value={(p.exitPosition ?? [0, 0, 0])[a]} className={inp + ' w-0 flex-1'} onChange={(e) => {
                      const cur = (p.exitPosition ?? [0, 0, 0]) as [number, number, number];
                      const next = [...cur] as [number, number, number];
                      next[a] = parseFloat(e.target.value) || 0;
                      set(p.id, { exitPosition: next });
                    }} />
                  ))}
                  {p.targetAreaId === areaId && (
                    <button onClick={() => useWorldSelectStore.getState().select(objKey(p.targetAreaId, 'landmark', `${p.id}_exit`))} title="Select the green exit marker's gizmo in 3D" className="rounded bg-slate-800 px-1.5 text-[10px] text-emerald-300 hover:bg-slate-700">🎯</button>
                  )}
                </div>
              </Field>
              <div className="mt-0.5 text-[9px] text-slate-500">The portal is the ENTRY (orange); the EXIT is a separate green marker you drag in the target area. Walk in / press [E] → you land on the exit.</div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Check label="interior (building)" checked={!!p.interior} onChange={(v) => set(p.id, { interior: v })} />
              <Check label="two-way (return door)" checked={!!p.twoWay} onChange={(v) => set(p.id, { twoWay: v })} />
              <Check label="locked" checked={!!p.locked} onChange={(v) => set(p.id, { locked: v })} />
              <Check label="fade on travel" checked={!!p.fade} onChange={(v) => set(p.id, { fade: v })} />
              <Field label="requires item id"><input value={p.requiresItemId ?? ''} onChange={(e) => set(p.id, { requiresItemId: e.target.value || undefined })} className={inp} placeholder="(none)" /></Field>
              <Field label="requires flag"><input value={p.requiresFlag ?? ''} onChange={(e) => set(p.id, { requiresFlag: e.target.value || undefined })} className={inp} placeholder="(none)" /></Field>
            </div>
            <div className="text-[9px] text-slate-500">Locked/required portals show 🔒 until the item is held or the flag is set. Tip: pair two portals (each targeting the other) for an enter/exit door.</div>
          </div>
        );
      })}
    </div>
  );
};
