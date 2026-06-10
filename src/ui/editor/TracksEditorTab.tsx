import { useState } from 'react';
import { usePlayerStore } from '../../stores/playerStore';
import { useWorldSelectStore } from '../../stores/worldSelectStore';
import { useEditorPathStore } from '../../stores/editorPathStore';
import { useEditorBoostPadStore } from '../../stores/editorBoostPadStore';
import { useEditorSurfaceStore } from '../../stores/editorSurfaceStore';
import { PATH_CONTROL_MODES, type PathControlMode, type PathCurveType, type PathDirectionMode } from '../../types/path';
import { BOOST_MODES, BOOST_EXIT_BEHAVIORS, type BoostMode, type BoostExitBehavior } from '../../types/boostPad';
import { SURFACE_TYPES, type SurfaceType } from '../../types/surface';
import { Field, inp, lbl, Check, csv, parseCsv, usePathOptions } from './editorShared';
import { IdSelect } from './idPickers';

// 🛣 Tracks tab — authoring for the movement systems (Paths · Boost Pads · Surfaces). Pure data editing; the
// in-scene gizmos (PathDebugLayer / BoostPadLayer) read the same stores, so edits and drags stay in sync. 🎯
// focuses the matching 3D handle (worldSelectStore key).
type Section = 'paths' | 'pads' | 'surfaces';
const focus = (key: string) => useWorldSelectStore.getState().select(key);
const CURVE_TYPES: PathCurveType[] = ['catmullRom', 'bezier', 'linear'];
const DIRECTIONS: PathDirectionMode[] = ['oneWay', 'twoWay'];
const num = (v: string, d = 0) => { const n = parseFloat(v); return Number.isNaN(n) ? d : n; };

export const TracksEditorTab = () => {
  const [section, setSection] = useState<Section>('paths');
  return (
    <div className="space-y-3 text-xs">
      <div className="flex gap-1">
        {(['paths', 'pads', 'surfaces'] as Section[]).map((s) => (
          <button key={s} onClick={() => setSection(s)} className={`rounded px-2.5 py-1 text-[11px] font-semibold ${section === s ? 'bg-violet-600/30 text-violet-100' : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'}`}>
            {s === 'paths' ? '🛤 Paths' : s === 'pads' ? '🚀 Boost Pads' : '🧱 Surfaces'}
          </button>
        ))}
      </div>
      {section === 'paths' ? <PathsSection /> : section === 'pads' ? <BoostPadsSection /> : <SurfacesSection />}
    </div>
  );
};

// ── Paths ──────────────────────────────────────────────────────────────────────
const PathsSection = () => {
  const paths = useEditorPathStore((s) => s.paths);
  const st = useEditorPathStore.getState();
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-lg border border-slate-700/60 bg-slate-900/40 px-2 py-1.5">
        <span className={lbl}>🛤 Paths ({paths.length})</span>
        <button onClick={() => st.addPath()} className="rounded bg-emerald-700/30 px-2 py-0.5 text-[11px] text-emerald-100 hover:bg-emerald-700/50">➕ path</button>
      </div>
      {paths.length === 0 && <div className="text-[11px] text-slate-500">No paths yet.</div>}
      {paths.map((p) => {
        const nodes = p.nodes ?? [];
        const nodeOpts = nodes.map((n) => ({ id: n.id, label: n.id }));
        return (
          <div key={p.id} className="space-y-1.5 rounded-lg border border-slate-700/60 bg-slate-900/40 p-2">
            <div className="flex items-center gap-1.5">
              <input value={p.name} onChange={(e) => st.updatePath(p.id, { name: e.target.value })} className={inp + ' flex-1'} placeholder="path name" />
              <button onClick={() => st.removePath(p.id)} className="rounded px-1 text-[11px] text-rose-400 hover:bg-slate-800">🗑</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="curve type"><select value={p.curveType} onChange={(e) => st.updatePath(p.id, { curveType: e.target.value as PathCurveType })} className={inp}>{CURVE_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}</select></Field>
              <Field label="direction"><select value={p.directionMode} onChange={(e) => st.updatePath(p.id, { directionMode: e.target.value as PathDirectionMode })} className={inp}>{DIRECTIONS.map((c) => <option key={c} value={c}>{c}</option>)}</select></Field>
              <Field label="default speed"><input type="number" step={0.5} value={p.defaultSpeed} onChange={(e) => st.updatePath(p.id, { defaultSpeed: num(e.target.value) })} className={inp} /></Field>
              <Field label="lane width"><input type="number" step={0.5} value={p.laneWidth} onChange={(e) => st.updatePath(p.id, { laneWidth: num(e.target.value) })} className={inp} /></Field>
              <Field label="entry node"><IdSelect value={p.entryNodeIds[0]} onChange={(v) => st.updatePath(p.id, { entryNodeIds: v ? [v] : [] })} options={nodeOpts} placeholder="(none)" /></Field>
              <Field label="exit node"><IdSelect value={p.exitNodeIds[0]} onChange={(v) => st.updatePath(p.id, { exitNodeIds: v ? [v] : [] })} options={nodeOpts} placeholder="(none)" /></Field>
            </div>
            <Check label="closed loop" checked={p.closed} onChange={(v) => st.updatePath(p.id, { closed: v })} />

            <div className="rounded border border-slate-700/50 bg-slate-900/50 p-1.5">
              <div className="flex items-center justify-between"><span className={lbl}>nodes ({nodes.length})</span>
                <button onClick={() => st.addNode(p.id)} className="rounded bg-sky-700/30 px-1.5 text-[11px] text-sky-100 hover:bg-sky-700/50">➕ node</button></div>
              {nodes.map((n) => (
                <div key={n.id} className="mt-1 flex items-center gap-1">
                  {([0, 1, 2] as const).map((a) => (
                    <input key={a} type="number" step={0.5} value={Math.round(n.position[a] * 100) / 100} className={inp + ' w-0 flex-1'} onChange={(e) => {
                      const next = [...n.position] as [number, number, number]; next[a] = num(e.target.value); st.updateNode(p.id, n.id, { position: next });
                    }} />
                  ))}
                  <input type="number" step={0.1} title="width" value={n.width} className={inp + ' w-14'} onChange={(e) => st.updateNode(p.id, n.id, { width: num(e.target.value, 1) })} />
                  <input type="number" step={0.1} title="speed×" value={n.speedMultiplier} className={inp + ' w-14'} onChange={(e) => st.updateNode(p.id, n.id, { speedMultiplier: num(e.target.value, 1) })} />
                  <button onClick={() => focus(`${p.id}#node#${n.id}`)} title="Select gizmo in 3D" className="rounded px-1 text-[11px] text-sky-300 hover:bg-slate-800">🎯</button>
                  <button onClick={() => st.removeNode(p.id, n.id)} className="rounded px-1 text-[11px] text-rose-400 hover:bg-slate-800">🗑</button>
                </div>
              ))}
              <div className="mt-0.5 text-[9px] text-slate-500">x / y / z · width · speed×. Drag the 🎯 handle in 3D — the line follows live.</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Boost Pads ─────────────────────────────────────────────────────────────────
const BoostPadsSection = () => {
  const areaId = usePlayerStore((s) => s.currentAreaId);
  const pads = useEditorBoostPadStore((s) => s.pads);
  const st = useEditorBoostPadStore.getState();
  const pathOpts = usePathOptions();
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-lg border border-slate-700/60 bg-slate-900/40 px-2 py-1.5">
        <span className={lbl}>🚀 Boost Pads ({pads.length})</span>
        <button onClick={() => st.addPad(areaId)} className="rounded bg-emerald-700/30 px-2 py-0.5 text-[11px] text-emerald-100 hover:bg-emerald-700/50">➕ at cam</button>
      </div>
      {pads.map((p) => (
        <div key={p.id} className="space-y-1.5 rounded-lg border border-slate-700/60 bg-slate-900/40 p-2">
          <div className="flex items-center gap-1.5">
            <Check label="enabled" checked={p.enabled} onChange={(v) => st.updatePad(p.id, { enabled: v })} />
            <span className="flex-1 text-[11px] text-slate-400">{p.id}</span>
            <button onClick={() => focus(`${p.id}#pad`)} title="Select gizmo in 3D" className="rounded px-1 text-[11px] text-sky-300 hover:bg-slate-800">🎯</button>
            <button onClick={() => st.removePad(p.id)} className="rounded px-1 text-[11px] text-rose-400 hover:bg-slate-800">🗑</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="boost mode"><select value={p.boostMode} onChange={(e) => st.updatePad(p.id, { boostMode: e.target.value as BoostMode })} className={inp}>{BOOST_MODES.map((m) => <option key={m} value={m}>{m}</option>)}</select></Field>
            <Field label="exit behavior"><select value={p.exitBehavior} onChange={(e) => st.updatePad(p.id, { exitBehavior: e.target.value as BoostExitBehavior })} className={inp}>{BOOST_EXIT_BEHAVIORS.map((m) => <option key={m} value={m}>{m}</option>)}</select></Field>
            <Field label="boost speed"><input type="number" step={0.5} value={p.boostSpeed} onChange={(e) => st.updatePad(p.id, { boostSpeed: num(e.target.value) })} className={inp} /></Field>
            <Field label="acceleration"><input type="number" step={1} value={p.acceleration} onChange={(e) => st.updatePad(p.id, { acceleration: num(e.target.value) })} className={inp} /></Field>
            <Field label="duration (s)"><input type="number" step={0.5} value={p.duration} onChange={(e) => st.updatePad(p.id, { duration: num(e.target.value) })} className={inp} /></Field>
            <Field label="cooldown (s)"><input type="number" step={0.5} value={p.cooldown} onChange={(e) => st.updatePad(p.id, { cooldown: num(e.target.value) })} className={inp} /></Field>
          </div>
          <Check label="enter path-follow" checked={p.enterPathFollow} onChange={(v) => st.updatePad(p.id, { enterPathFollow: v })} />
          {p.enterPathFollow && (
            <div className="grid grid-cols-2 gap-2">
              <Field label="linked path"><IdSelect value={p.linkedPathId} onChange={(v) => st.updatePad(p.id, { linkedPathId: v })} options={pathOpts} placeholder="(path)" /></Field>
              <Field label="control mode"><select value={p.pathControlMode ?? 'forwardLocked'} onChange={(e) => st.updatePad(p.id, { pathControlMode: e.target.value as PathControlMode })} className={inp}>{PATH_CONTROL_MODES.map((m) => <option key={m} value={m}>{m}</option>)}</select></Field>
            </div>
          )}
          <Field label="tags (comma-separated)"><input value={csv(p.requiredTags)} onChange={(e) => st.updatePad(p.id, { requiredTags: parseCsv(e.target.value) })} className={inp} placeholder="(any)" /></Field>
        </div>
      ))}
    </div>
  );
};

// ── Surfaces ─────────────────────────────────────────────────────────────────
const SurfacesSection = () => {
  const surfaces = useEditorSurfaceStore((s) => s.surfaces);
  const st = useEditorSurfaceStore.getState();
  const pathOpts = usePathOptions();
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-lg border border-slate-700/60 bg-slate-900/40 px-2 py-1.5">
        <span className={lbl}>🧱 Surfaces ({surfaces.length})</span>
        <button onClick={() => st.addSurface()} className="rounded bg-emerald-700/30 px-2 py-0.5 text-[11px] text-emerald-100 hover:bg-emerald-700/50">➕ surface</button>
      </div>
      {surfaces.map((s) => (
        <div key={s.id} className="space-y-1.5 rounded-lg border border-slate-700/60 bg-slate-900/40 p-2">
          <div className="flex items-center gap-1.5">
            <input value={s.name} onChange={(e) => st.updateSurface(s.id, { name: e.target.value })} className={inp + ' flex-1'} placeholder="surface name" />
            <button onClick={() => st.removeSurface(s.id)} className="rounded px-1 text-[11px] text-rose-400 hover:bg-slate-800">🗑</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="surface type"><select value={s.surfaceType} onChange={(e) => st.updateSurface(s.id, { surfaceType: e.target.value as SurfaceType })} className={inp}>{SURFACE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
            <Field label="friction"><input type="number" step={0.05} value={s.friction} onChange={(e) => st.updateSurface(s.id, { friction: num(e.target.value, 1) })} className={inp} /></Field>
            <Field label="accel ×"><input type="number" step={0.05} value={s.accelerationMultiplier} onChange={(e) => st.updateSurface(s.id, { accelerationMultiplier: num(e.target.value, 1) })} className={inp} /></Field>
            <Field label="max-speed ×"><input type="number" step={0.05} value={s.maxSpeedMultiplier} onChange={(e) => st.updateSurface(s.id, { maxSpeedMultiplier: num(e.target.value, 1) })} className={inp} /></Field>
            <Field label="steering ×"><input type="number" step={0.05} value={s.steeringMultiplier} onChange={(e) => st.updateSurface(s.id, { steeringMultiplier: num(e.target.value, 1) })} className={inp} /></Field>
            <Field label="braking ×"><input type="number" step={0.05} value={s.brakingMultiplier} onChange={(e) => st.updateSurface(s.id, { brakingMultiplier: num(e.target.value, 1) })} className={inp} /></Field>
            <Field label="path assist"><input type="number" step={0.1} value={s.pathAssistStrength} onChange={(e) => st.updateSurface(s.id, { pathAssistStrength: num(e.target.value) })} className={inp} /></Field>
            <Field label="linked path"><IdSelect value={s.linkedPathId} onChange={(v) => st.updateSurface(s.id, { linkedPathId: v })} options={pathOpts} placeholder="(none)" /></Field>
          </div>
          <Check label="enter path-follow on this surface" checked={s.enterPathFollow} onChange={(v) => st.updateSurface(s.id, { enterPathFollow: v })} />
          <Field label="tags (comma-separated)"><input value={csv(s.tags)} onChange={(e) => st.updateSurface(s.id, { tags: parseCsv(e.target.value) })} className={inp} /></Field>
        </div>
      ))}
      <div className="text-[9px] text-slate-500">Surface multipliers are authoring data; runtime application to movement is a later phase.</div>
    </div>
  );
};
