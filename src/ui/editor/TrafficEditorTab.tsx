import { useEditorTrafficStore } from '../../stores/editorTrafficStore';
import { usePlayerStore } from '../../stores/playerStore';
import { editorSpawn } from '../../stores/sceneEditStore';
import { Field, inp, lbl } from './editorShared';
import { ModelPicker } from './ModelPicker';

const camPos = (): [number, number, number] => [Math.round(editorSpawn.x * 100) / 100, 0.5, Math.round(editorSpawn.z * 100) / 100];

// 🚦 Traffic tab — edit vehicles, signals and road loops for the current area. Auto-saves; applies live.
export const TrafficEditorTab = () => {
  const areaId = usePlayerStore((s) => s.currentAreaId);
  const t = useEditorTrafficStore();
  const vehicles = t.vehicles.filter((v) => v.areaId === areaId);
  const signals = t.signals.filter((s) => s.areaId === areaId);
  const roads = t.roads.filter((r) => r.areaId === areaId);
  const roadIds = roads.map((r) => r.id);
  const crosswalks = t.crosswalks.filter((c) => c.areaId === areaId);

  return (
    <div className="space-y-3 overflow-y-auto text-xs">
      {/* Global traffic behaviour */}
      <div className="space-y-1.5 rounded-lg border border-slate-700/60 bg-slate-900/40 px-2 py-1.5">
        <label className="flex items-center gap-2 text-[11px] text-slate-300">
          <input type="checkbox" checked={t.emergencyYield} onChange={(e) => t.setEmergencyYield(e.target.checked)} className="accent-amber-500" />
          🚨 Emergency yield — vehicles slow when an incident/rescue is active
        </label>
        <label className="flex items-center gap-2 text-[11px] text-slate-300">
          <input type="checkbox" checked={t.vehicleIncidents} onChange={(e) => t.setVehicleIncidents(e.target.checked)} className="accent-rose-500" />
          🤖 Traffic AI incidents — vehicles trigger incidents to respond to
        </label>
        {t.vehicleIncidents && (
          <label className="flex items-center gap-1 text-[11px] text-slate-400">every
            <input type="number" min={5} step={5} value={t.vehicleIncidentEverySec} onChange={(e) => t.setVehicleIncidentEverySec(parseInt(e.target.value, 10) || 45)} className={inp + ' w-16'} /> sec
          </label>
        )}
      </div>

      {/* Roads */}
      <section className="space-y-1.5">
        <div className="flex items-center justify-between"><span className={lbl}>Roads ({roads.length})</span>
          <button onClick={() => t.addRoad(areaId)} className="rounded bg-emerald-700/30 px-2 py-0.5 text-[11px] text-emerald-100 hover:bg-emerald-700/50">➕ road</button></div>
        {roads.map((r) => (
          <div key={r.id} className="space-y-1 rounded-lg border border-slate-700/60 bg-slate-900/40 p-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400">{r.id} · {r.waypoints.length} pts{r.closed ? ' · CLOSED' : ''}</span>
              <div className="flex items-center gap-1">
                <label className="flex items-center gap-1 text-[10px] text-rose-300"><input type="checkbox" checked={!!r.closed} onChange={(e) => t.setRoadClosed(r.id, e.target.checked)} className="accent-rose-500" />closed</label>
                <button onClick={() => t.addRoadWaypoint(r.id, camPos())} className="rounded bg-emerald-700/30 px-2 py-0.5 text-[10px] text-emerald-100">➕ at cam</button>
                <button onClick={() => t.removeRoad(r.id)} className="rounded px-1 text-[11px] text-rose-400 hover:bg-slate-800">🗑</button>
              </div>
            </div>
            {r.waypoints.map((wp, i) => (
              <div key={i} className="flex items-center gap-1">
                <span className="w-5 text-[10px] text-slate-500">{i + 1}</span>
                {([0, 1, 2] as const).map((a) => (
                  <input key={a} type="number" step={0.5} value={wp[a]} className={inp + ' w-0 flex-1'} onChange={(e) => {
                    const next = [...wp] as [number, number, number]; next[a] = parseFloat(e.target.value) || 0; t.updateRoadWaypoint(r.id, i, next);
                  }} />
                ))}
                <button onClick={() => t.removeRoadWaypoint(r.id, i)} className="rounded px-1 text-[10px] text-rose-400 hover:bg-slate-800">✕</button>
              </div>
            ))}
          </div>
        ))}
      </section>

      {/* Vehicles */}
      <section className="space-y-1.5">
        <div className="flex items-center justify-between"><span className={lbl}>Vehicles ({vehicles.length})</span>
          <button onClick={() => t.addVehicle(areaId)} className="rounded bg-emerald-700/30 px-2 py-0.5 text-[11px] text-emerald-100 hover:bg-emerald-700/50">➕ vehicle</button></div>
        {vehicles.map((v) => (
          <div key={v.id} className="space-y-1.5 rounded-lg border border-slate-700/60 bg-slate-900/40 p-2">
            <div className="flex items-center gap-2">
              <input type="color" value={v.color} onChange={(e) => t.updateVehicle(v.id, { color: e.target.value })} className="h-6 w-8 rounded border-0 bg-transparent" />
              <input value={v.name} onChange={(e) => t.updateVehicle(v.id, { name: e.target.value })} className={inp + ' flex-1'} placeholder="name" />
              <button onClick={() => t.removeVehicle(v.id)} className="rounded px-1 text-[11px] text-rose-400 hover:bg-slate-800">🗑</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="path">
                <select value={v.pathId} onChange={(e) => t.updateVehicle(v.id, { pathId: e.target.value })} className={inp}>
                  <option value="">—</option>{roadIds.map((id) => <option key={id} value={id}>{id}</option>)}
                </select>
              </Field>
              <Field label="speed"><input type="number" step={0.5} value={v.speed} onChange={(e) => t.updateVehicle(v.id, { speed: parseFloat(e.target.value) || 0 })} className={inp} /></Field>
              <Field label="start offset (0–1)"><input type="number" step={0.05} min={0} max={1} value={v.initialProgress} onChange={(e) => t.updateVehicle(v.id, { initialProgress: parseFloat(e.target.value) || 0 })} className={inp} /></Field>
              <Field label="kind">
                <select value={v.kind ?? 'car'} onChange={(e) => t.updateVehicle(v.id, { kind: e.target.value as typeof v.kind })} className={inp}>
                  {['car', 'truck', 'bus', 'emergency', 'drone'].map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </Field>
              <Field label="model scale"><input type="number" step={0.5} value={v.modelScale ?? 2.4} onChange={(e) => t.updateVehicle(v.id, { modelScale: parseFloat(e.target.value) || 0 })} className={inp} /></Field>
              <Field label="count (loop copies)"><input type="number" min={1} max={30} step={1} value={v.count ?? 1} onChange={(e) => t.updateVehicle(v.id, { count: parseInt(e.target.value, 10) || 1 })} className={inp} /></Field>
            </div>
            <Field label="model (empty = box)"><ModelPicker value={v.modelAssetId || undefined} onChange={(val) => t.updateVehicle(v.id, { modelAssetId: val ?? '' })} allowNone noneLabel="(box)" /></Field>
          </div>
        ))}
      </section>

      {/* Signals */}
      <section className="space-y-1.5">
        <div className="flex items-center justify-between"><span className={lbl}>Signals ({signals.length})</span>
          <button onClick={() => t.addSignal(areaId)} className="rounded bg-emerald-700/30 px-2 py-0.5 text-[11px] text-emerald-100 hover:bg-emerald-700/50">➕ signal</button></div>
        {signals.map((s) => (
          <div key={s.id} className="space-y-1.5 rounded-lg border border-slate-700/60 bg-slate-900/40 p-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400">{s.id}</span>
              <button onClick={() => t.removeSignal(s.id)} className="rounded px-1 text-[11px] text-rose-400 hover:bg-slate-800">🗑</button>
            </div>
            <Field label="position (x / y / z)">
              <div className="flex gap-1">
                {([0, 1, 2] as const).map((a) => (
                  <input key={a} type="number" step={0.5} value={s.position[a]} className={inp + ' w-0 flex-1'} onChange={(e) => {
                    const next = [...s.position] as [number, number, number]; next[a] = parseFloat(e.target.value) || 0; t.updateSignal(s.id, { position: next });
                  }} />
                ))}
                <button onClick={() => t.updateSignal(s.id, { position: camPos() })} className="rounded px-1 text-[10px] text-sky-300 hover:bg-slate-800">cam</button>
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="on path">
                <select value={s.pathId} onChange={(e) => t.updateSignal(s.id, { pathId: e.target.value })} className={inp}>
                  <option value="">—</option>{roadIds.map((id) => <option key={id} value={id}>{id}</option>)}
                </select>
              </Field>
              <Field label="stop at (0–1)"><input type="number" step={0.05} min={0} max={1} value={s.progressOnPath} onChange={(e) => t.updateSignal(s.id, { progressOnPath: parseFloat(e.target.value) || 0 })} className={inp} /></Field>
              <Field label="green s"><input type="number" value={s.greenSeconds} onChange={(e) => t.updateSignal(s.id, { greenSeconds: parseFloat(e.target.value) || 0 })} className={inp} /></Field>
              <Field label="yellow s"><input type="number" value={s.yellowSeconds} onChange={(e) => t.updateSignal(s.id, { yellowSeconds: parseFloat(e.target.value) || 0 })} className={inp} /></Field>
              <Field label="red s"><input type="number" value={s.redSeconds} onChange={(e) => t.updateSignal(s.id, { redSeconds: parseFloat(e.target.value) || 0 })} className={inp} /></Field>
            </div>
            <Field label="model (empty = pole)"><ModelPicker value={s.modelAssetId || undefined} onChange={(val) => t.updateSignal(s.id, { modelAssetId: val ?? '' })} allowNone noneLabel="(pole)" /></Field>
          </div>
        ))}
      </section>

      {/* Crosswalks */}
      <section className="space-y-1.5">
        <div className="flex items-center justify-between"><span className={lbl}>Crosswalks ({crosswalks.length})</span>
          <button onClick={() => t.addCrosswalk(areaId, camPos())} className="rounded bg-emerald-700/30 px-2 py-0.5 text-[11px] text-emerald-100 hover:bg-emerald-700/50">➕ at cam</button></div>
        {crosswalks.map((c) => (
          <div key={c.id} className="space-y-1.5 rounded-lg border border-slate-700/60 bg-slate-900/40 p-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400">{c.id}</span>
              <button onClick={() => t.removeCrosswalk(c.id)} className="rounded px-1 text-[11px] text-rose-400 hover:bg-slate-800">🗑</button>
            </div>
            <Field label="position (x / y / z)">
              <div className="flex gap-1">
                {([0, 1, 2] as const).map((a) => (
                  <input key={a} type="number" step={0.5} value={c.position[a]} className={inp + ' w-0 flex-1'} onChange={(e) => {
                    const next = [...c.position] as [number, number, number]; next[a] = parseFloat(e.target.value) || 0; t.updateCrosswalk(c.id, { position: next });
                  }} />
                ))}
                <button onClick={() => t.updateCrosswalk(c.id, { position: camPos() })} className="rounded px-1 text-[10px] text-sky-300 hover:bg-slate-800">cam</button>
              </div>
            </Field>
            <div className="grid grid-cols-3 gap-2">
              <Field label="length"><input type="number" step={0.5} min={1} value={c.length} onChange={(e) => t.updateCrosswalk(c.id, { length: parseFloat(e.target.value) || 1 })} className={inp} /></Field>
              <Field label="axis">
                <select value={c.axis} onChange={(e) => t.updateCrosswalk(c.id, { axis: e.target.value as 'x' | 'z' })} className={inp}>
                  <option value="x">x</option><option value="z">z</option>
                </select>
              </Field>
              <Field label="linked signal">
                <select value={c.linkedSignalId ?? ''} onChange={(e) => t.updateCrosswalk(c.id, { linkedSignalId: e.target.value || undefined })} className={inp}>
                  <option value="">(always)</option>{signals.map((s) => <option key={s.id} value={s.id}>{s.id}</option>)}
                </select>
              </Field>
              <Field label="ped speed"><input type="number" step={0.2} value={c.pedSpeed ?? 1.2} onChange={(e) => t.updateCrosswalk(c.id, { pedSpeed: parseFloat(e.target.value) || 0 })} className={inp} /></Field>
            </div>
            <Field label="pedestrian model (empty = capsule)"><ModelPicker value={c.pedModelAssetId || undefined} onChange={(val) => t.updateCrosswalk(c.id, { pedModelAssetId: val ?? '' })} allowNone noneLabel="(capsule)" /></Field>
          </div>
        ))}
      </section>
    </div>
  );
};
