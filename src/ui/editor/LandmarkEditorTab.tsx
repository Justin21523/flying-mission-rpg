import { useEditorLandmarkStore } from '../../stores/editorLandmarkStore';
import { usePlayerStore } from '../../stores/playerStore';
import { useSceneEditStore } from '../../stores/sceneEditStore';
import { objKey } from '../../game/edit/sceneEditMerge';
import { getKitArea } from '../../data/areas';
import { Field, inp, lbl } from './editorShared';
import { ModelPicker } from './ModelPicker';

// 🗺 Landmarks tab — manage the current area's landmarks (name, model, position). Each area should
// have a clear landmark; stubs now, models later. Position is also gizmo-movable in the 3D view.
export const LandmarkEditorTab = () => {
  const areaId = usePlayerStore((s) => s.currentAreaId);
  const landmarks = useEditorLandmarkStore((s) => s.landmarks);
  const add = useEditorLandmarkStore((s) => s.addLandmark);
  const update = useEditorLandmarkStore((s) => s.updateLandmark);
  const remove = useEditorLandmarkStore((s) => s.removeLandmark);
  const overrides = useSceneEditStore((s) => s.overrides); // live gizmo positions
  const here = landmarks.filter((l) => l.areaId === areaId);
  const areaName = getKitArea(areaId)?.name ?? areaId;

  return (
    <div className="space-y-3 text-xs">
      <div className="flex items-center justify-between">
        <div className={lbl}>Landmarks · {areaName} ({here.length})</div>
        <button
          onClick={() => add(areaId, [0, 0, 4])}
          className="rounded bg-emerald-700/30 px-2 py-1 text-[11px] text-emerald-100 hover:bg-emerald-700/50"
        >➕ Add landmark</button>
      </div>

      {here.length === 0 && <div className="text-slate-500">No landmark in this area yet — add one so the area is recognisable.</div>}

      {here.map((l) => (
        <div key={l.id} className="space-y-2 rounded-lg border border-slate-700/60 bg-slate-900/40 p-2">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <input value={l.name} onChange={(e) => update(l.id, { name: e.target.value })} className={inp + ' flex-1'} placeholder="Landmark name" />
            <button onClick={() => remove(l.id)} className="rounded px-1 text-[11px] text-rose-400 hover:bg-slate-800">🗑</button>
          </div>
          <Field label="Model (empty = stub pillar)">
            <ModelPicker value={l.modelAssetId ?? undefined} onChange={(v) => update(l.id, { modelAssetId: v ?? null })} noneLabel="(stub pillar)" />
          </Field>
          <Field label="Position (x / y / z) — live with the gizmo">
            <div className="flex gap-1">
              {([0, 1, 2] as const).map((a) => {
                // Show the merged position so dragging the gizmo updates these numbers live.
                const livePos = (overrides[objKey(l.areaId, 'landmark', l.id)]?.position ?? l.position) as [number, number, number];
                return (
                  <input
                    key={a}
                    type="number"
                    step={0.5}
                    value={Math.round(livePos[a] * 100) / 100}
                    className={inp + ' w-0 flex-1 text-center'}
                    onChange={(e) => {
                      const next = [...livePos] as [number, number, number];
                      next[a] = parseFloat(e.target.value) || 0;
                      update(l.id, { position: next });
                      // Clear the gizmo override so the typed value is the truth.
                      useSceneEditStore.getState().setOverride(objKey(l.areaId, 'landmark', l.id), { position: undefined });
                    }}
                  />
                );
              })}
            </div>
          </Field>
          <div className="text-[10px] text-slate-500">Tip: click the landmark in 3D and drag the gizmo — these numbers follow.</div>
        </div>
      ))}
    </div>
  );
};
