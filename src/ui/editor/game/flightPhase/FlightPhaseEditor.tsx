import { useEffect } from 'react';
import { useFlightPhaseStore, cameraKeyframeForNode, copyCameraSettings, getCameraClipboard } from '../../../../stores/game/flightPhaseStore';
import { useFlightTimelineStore, FLIGHT_VIEW_MODES, type FlightViewMode } from '../../../../stores/game/flightTimelineStore';
import { useWorldSelectStore } from '../../../../stores/worldSelectStore';
import { useGameStore } from '../../../../stores/game/useGameStore';
import { focusCameraOnFramed } from '../../../../game/edit/cameraFocus';
import { getNodeTimes } from '../../../../game/flight/flightPhaseRuntime';
import { fireFlightEvent } from '../../../../game/flight/flightPhaseEventFire';
import { editCameraHandle } from '../../../../game/camera/editCameraHandle';
import { FLIGHT_POSES, FLIGHT_TRANSITIONS, FLIGHT_EVENT_TYPES, FLIGHT_CAMERA_MODES } from '../../../../types/game/flightPhase';
import type { FlightCameraKeyframe, FlightCameraMode, FlightCurveType, FlightPathNode, FlightPhaseConfig, FlightTimelineEvent } from '../../../../types/game/flightPhase';

const FLIGHT_CURVE_HELP = [
  { value: 'catmullRom', label: 'catmullRom (smooth)' },
  { value: 'bezier', label: 'bezier (handles)' },
  { value: 'linear', label: 'linear (straight)' },
] as const;
import { Field, inp, lbl, MoveButtons } from '../../editorShared';
import { NumRow, SelectRow, TextRow } from '../CollectionEditor';

// 🛰 Flight Phase editor — the five authoring panels for the base-orbit (and any) Flight Phase. Edits write to
// flightPhaseStore (the single source of truth); the bottom-left overlay + 3D gizmos reflect them instantly at
// the current timeline second. Node/keyframe focus reframes (no over-zoom) and seeks the timeline to that point.
const NODE_KEY = (pathId: string, nodeId: string) => `${pathId}#fnode#${nodeId}`;
const CAM_KEY = (phaseId: string, id: string) => `${phaseId}#fcam#${id}`;
const Vec3 = ({ label, value, onChange, step = 0.5 }: { label: string; value: [number, number, number]; onChange: (v: [number, number, number]) => void; step?: number }) => (
  <Field label={label}>
    <div className="flex gap-1">
      {([0, 1, 2] as const).map((a) => (
        <input key={a} type="number" step={step} value={Math.round(value[a] * 100) / 100}
          onChange={(e) => { const n = [...value] as [number, number, number]; n[a] = parseFloat(e.target.value) || 0; onChange(n); }}
          className={inp + ' w-0 flex-1 text-center'} />
      ))}
    </div>
  </Field>
);

// Per-node camera: binds to the node's owned keyframe (cameraKeyframeForNode). Enable creates a keyframe at the
// node's time; all edits write the SAME cameraKeyframes the preview + play read → instant + consistent.
const NodeCameraPanel = ({ phase, node }: { phase: FlightPhaseConfig; node: FlightPathNode }) => {
  const store = useFlightPhaseStore.getState();
  const tl = useFlightTimelineStore();
  const kf = cameraKeyframeForNode(phase, node.nodeId);
  if (!kf) {
    return (
      <div className="mt-1 rounded border border-fuchsia-800/40 bg-slate-950/40 p-1.5">
        <button onClick={() => { const id = store.addCameraKeyForNode(phase.phaseId, node.nodeId); if (id) tl.selectKeyframe(id); }} className="w-full rounded bg-fuchsia-700/30 px-2 py-1 text-[11px] text-fuchsia-100 hover:bg-fuchsia-700/50">🎥 Enable camera for this node</button>
      </div>
    );
  }
  const up = (patch: Partial<FlightCameraKeyframe>) => store.updateCameraKey(phase.phaseId, kf.keyframeId, patch);
  const mode = kf.cameraMode ?? 'fixed';
  const dupFromPrev = () => {
    const i = phase.path.nodes.findIndex((n) => n.nodeId === node.nodeId);
    for (let j = i - 1; j >= 0; j -= 1) {
      const prev = cameraKeyframeForNode(phase, phase.path.nodes[j].nodeId);
      if (prev) { const rest = { ...prev } as Partial<FlightCameraKeyframe>; delete rest.keyframeId; delete rest.time; delete rest.nodeId; up(rest); return; }
    }
  };
  return (
    <div className="mt-1 space-y-1 rounded border border-fuchsia-700/50 bg-fuchsia-950/20 p-1.5">
      <div className="flex items-center justify-between">
        <span className={lbl}>🎥 Node camera</span>
        <button onClick={() => store.removeCameraKey(phase.phaseId, kf.keyframeId)} className="rounded bg-rose-800/40 px-2 py-0.5 text-[10px] text-rose-200 hover:bg-rose-800/60">Remove</button>
      </div>
      <SelectRow label="Camera mode" value={mode} options={FLIGHT_CAMERA_MODES.map((m) => ({ value: m, label: m }))} onChange={(v) => up({ cameraMode: v as FlightCameraMode })} />
      <Vec3 label="Camera position (x / y / z)" value={kf.position} onChange={(v) => up({ position: v })} />
      {(mode === 'fixed' || mode === 'lookAtNode' || mode === 'lookAtNextNode') && <Vec3 label="Look-at (x / y / z)" value={kf.lookAtTarget ?? [...node.position] as [number, number, number]} onChange={(v) => up({ lookAtTarget: v })} />}
      {mode === 'follow' && <Vec3 label="Follow offset (x / y / z)" value={kf.followOffset ?? [0, 0, 0]} onChange={(v) => up({ followOffset: v })} />}
      <div className="grid grid-cols-3 gap-1.5">
        <NumRow label="FOV" value={kf.fov} step={1} min={10} max={120} onChange={(v) => up({ fov: v })} />
        {(mode === 'follow') && <NumRow label="Distance" value={kf.distance ?? 12} step={0.5} min={0} onChange={(v) => up({ distance: v })} />}
        {(mode === 'follow') && <NumRow label="Height" value={kf.height ?? 5} step={0.5} onChange={(v) => up({ height: v })} />}
        {(mode === 'orbit') && <NumRow label="Orbit R" value={kf.orbitRadius ?? 14} step={1} min={1} onChange={(v) => up({ orbitRadius: v })} />}
        {(mode === 'orbit') && <NumRow label="Orbit H" value={kf.orbitHeight ?? 6} step={1} onChange={(v) => up({ orbitHeight: v })} />}
        <NumRow label="Damping" value={kf.damping ?? 0.4} step={0.05} min={0} max={1} onChange={(v) => up({ damping: v })} />
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <SelectRow label="Transition" value={kf.transitionType} options={FLIGHT_TRANSITIONS.map((t) => ({ value: t, label: t }))} onChange={(v) => up({ transitionType: v as FlightCameraKeyframe['transitionType'] })} />
        <NumRow label="Transition (s)" value={kf.transitionDuration ?? 0.6} step={0.1} min={0} onChange={(v) => up({ transitionDuration: v })} />
      </div>
      <div className="flex flex-wrap gap-1">
        <button onClick={() => { tl.scrub(kf.time); if (!tl.cameraPreview) tl.toggleCameraPreview(); }} className="rounded bg-fuchsia-700/30 px-2 py-0.5 text-[10px] text-fuchsia-100 hover:bg-fuchsia-700/50">👁 Preview</button>
        <button onClick={() => up({ cameraMode: 'fixed', position: [editCameraHandle.camX, editCameraHandle.camY, editCameraHandle.camZ], lookAtTarget: [editCameraHandle.targetX, editCameraHandle.targetY, editCameraHandle.targetZ] })} className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-200 hover:bg-slate-700">Apply editor cam</button>
        <button onClick={dupFromPrev} className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-200 hover:bg-slate-700">Dup from prev</button>
        <button onClick={() => copyCameraSettings(kf)} className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-200 hover:bg-slate-700">Copy</button>
        <button onClick={() => { const c = getCameraClipboard(); if (c) up(c); }} className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-200 hover:bg-slate-700">Paste</button>
      </div>
    </div>
  );
};

export const FlightPhaseEditor = () => {
  const phases = useFlightPhaseStore((s) => s.phases);
  const phase = useFlightPhaseStore((s) => s.phases.find((p) => p.phaseId === s.activePhaseId) ?? s.phases[0]);
  const store = useFlightPhaseStore.getState();
  const tl = useFlightTimelineStore();
  // Auto-select the first node so the Selected Node Panel is populated as soon as the editor opens.
  useEffect(() => {
    const t = useFlightTimelineStore.getState();
    if (t.selectedNodeId) return;
    const first = phase?.path.nodes[0];
    if (first) t.selectNode(first.nodeId);
  }, [phase]);
  if (!phase) return null;
  const path = phase.path;
  const nodeTimes = getNodeTimes(path);
  const editIn3D = () => {
    useGameStore.getState().jumpTo(phase.gamePhase); // mount this phase's scene so 3D gizmos + the overlay show
    const first = path.nodes[0];
    if (first) selectNode(first);
  };

  const selectNode = (n: FlightPathNode) => {
    const i = path.nodes.findIndex((x) => x.nodeId === n.nodeId);
    useWorldSelectStore.getState().select(NODE_KEY(path.pathId, n.nodeId), () => store.removeNode(phase.phaseId, n.nodeId));
    tl.selectNode(n.nodeId);
    if (i >= 0) tl.scrub(nodeTimes[i] ?? 0);
    focusCameraOnFramed(n.position[0], n.position[1], n.position[2], 14);
  };
  const selectKey = (k: FlightCameraKeyframe) => {
    useWorldSelectStore.getState().select(CAM_KEY(phase.phaseId, k.keyframeId), () => store.removeCameraKey(phase.phaseId, k.keyframeId));
    tl.selectKeyframe(k.keyframeId);
    tl.scrub(k.time);
    focusCameraOnFramed(k.position[0], k.position[1], k.position[2], 14);
  };

  const selNode = path.nodes.find((n) => n.nodeId === tl.selectedNodeId);
  const selKey = phase.cameraKeyframes.find((k) => k.keyframeId === tl.selectedKeyframeId);
  const selEvent = phase.events.find((e) => e.eventId === tl.selectedEventId);
  const patchNode = (id: string, patch: Partial<FlightPathNode>) => store.updateNode(phase.phaseId, id, patch);
  // Seed bezier handles pointing along the path: out → toward next node, in → toward previous (length ~6).
  const neighbourHandles = (nodeId: string) => {
    const len = path.nodes.length;
    const idx = path.nodes.findIndex((n) => n.nodeId === nodeId);
    const here = path.nodes[idx].position;
    const dirTo = (p: [number, number, number]): [number, number, number] => {
      const d: [number, number, number] = [p[0] - here[0], p[1] - here[1], p[2] - here[2]];
      const l = Math.hypot(d[0], d[1], d[2]) || 1;
      return [(d[0] / l) * 6, (d[1] / l) * 6, (d[2] / l) * 6];
    };
    return { inn: dirTo(path.nodes[(idx - 1 + len) % len].position), out: dirTo(path.nodes[(idx + 1) % len].position) };
  };

  const phaseNow = useGameStore.getState().phase;
  const atFlight = phaseNow === phase.gamePhase;
  return (
    <div className="space-y-2">
      {/* Phase selector — pick which flight leg to edit (base orbit / aerial cruise / return / …). */}
      <Field label="Flight phase">
        <select value={phase.phaseId} onChange={(e) => store.setActivePhase(e.target.value)} className={inp}>
          {phases.map((p) => <option key={p.phaseId} value={p.phaseId}>{p.phaseName} · {p.gamePhase}</option>)}
        </select>
      </Field>
      {/* Entry point — jump into THIS phase's scene so the 3D node/camera gizmos + bottom-left playback bar show. */}
      <button onClick={editIn3D} className={`w-full rounded px-2 py-1.5 text-[12px] font-semibold ${atFlight ? 'bg-emerald-700/40 text-emerald-100 hover:bg-emerald-700/60' : 'bg-violet-600 text-white hover:bg-violet-500'}`}>
        {atFlight ? '✓ Editing in 3D — drag nodes / camera gizmos' : `▶ Edit in 3D (jump to ${phase.gamePhase})`}
      </button>

      {/* 1 — Flight Path Panel */}
      <section className="rounded border border-sky-700/40 bg-sky-950/20 p-2">
        <div className="mb-1 flex items-center justify-between">
          <span className={lbl}>🛰 Flight path · {path.nodes.length} nodes</span>
          <span className="font-mono text-[10px] text-slate-400">{path.totalDistance.toFixed(0)}u · {path.totalDuration.toFixed(2)}s</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <TextRow label="Phase name" value={phase.phaseName} onChange={(v) => store.updatePhase(phase.phaseId, { phaseName: v })} />
          <TextRow label="Path name" value={path.pathName} onChange={(v) => store.updatePhase(phase.phaseId, { path: { ...path, pathName: v } })} />
          <SelectRow label="Curve type" value={path.curveType} options={FLIGHT_CURVE_HELP} onChange={(v) => store.updatePhase(phase.phaseId, { path: { ...path, curveType: v as FlightCurveType } })} />
          <label className="flex items-end gap-1.5 pb-1 text-xs text-slate-300"><input type="checkbox" checked={path.closedLoop} onChange={(e) => store.updatePhase(phase.phaseId, { path: { ...path, closedLoop: e.target.checked } })} className="accent-sky-500" /> Closed loop</label>
        </div>
        <div className="mt-1 flex flex-wrap gap-1">
          <button onClick={() => { const id = store.addNode(phase.phaseId); if (id) tl.selectNode(id); }} className="rounded bg-sky-700/30 px-2 py-0.5 text-[11px] text-sky-100 hover:bg-sky-700/50">+ Node</button>
          <button onClick={() => store.recalc(phase.phaseId)} className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-200 hover:bg-slate-700">↻ Recalculate</button>
          <button onClick={() => store.smooth(phase.phaseId)} className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-200 hover:bg-slate-700">∿ Smooth</button>
          <button onClick={() => store.resetPhase(phase.phaseId)} className="rounded bg-rose-700/25 px-2 py-0.5 text-[11px] text-rose-200 hover:bg-rose-700/40">↺ Reset phase</button>
        </div>
        <div className="mt-1 space-y-0.5">
          {path.nodes.map((n, i) => {
            const sel = tl.selectedNodeId === n.nodeId;
            return (
              <div key={n.nodeId} className={`flex items-center gap-1 rounded border px-1.5 py-0.5 ${sel ? 'border-violet-500/70 bg-violet-950/30' : 'border-slate-800 bg-slate-900/50'}`}>
                <span className="w-5 text-center text-[11px] font-bold text-sky-200">{i + 1}</span>
                <button onClick={() => selectNode(n)} className="flex-1 truncate text-left text-[11px] text-slate-200 hover:text-sky-200">{n.nodeName}</button>
                <span className="font-mono text-[9px] text-slate-500">{(nodeTimes[i] ?? 0).toFixed(1)}s</span>
                <MoveButtons index={i} count={path.nodes.length} onMove={(d) => store.reorderNode(phase.phaseId, n.nodeId, d)} />
                <button onClick={() => store.insertNodeBetween(phase.phaseId, i)} title="Insert node after" className="rounded bg-slate-800 px-1 text-[10px] text-slate-300 hover:bg-slate-700">⎀</button>
                <button onClick={() => { const id = store.duplicateNode(phase.phaseId, n.nodeId); if (id) tl.selectNode(id); }} title="Duplicate" className="rounded bg-slate-800 px-1 text-[10px] text-slate-300 hover:bg-slate-700">⧉</button>
                <button onClick={() => store.removeNode(phase.phaseId, n.nodeId)} title="Delete" className="rounded bg-rose-800/40 px-1 text-[10px] text-rose-200 hover:bg-rose-800/60">✕</button>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2 — Selected Node Panel */}
      {selNode && (
        <section className="rounded border border-violet-700/50 bg-violet-950/15 p-2">
          <div className="mb-1 flex items-center justify-between">
            <span className={lbl}>● Node · {selNode.nodeName}</span>
            <button onClick={() => selectNode(selNode)} className="rounded bg-sky-700/30 px-2 py-0.5 text-[10px] text-sky-100 hover:bg-sky-700/50">🎯 Focus</button>
          </div>
          <TextRow label="Name" value={selNode.nodeName} onChange={(v) => patchNode(selNode.nodeId, { nodeName: v })} />
          <Vec3 label="Position (x / y / z)" value={selNode.position} onChange={(v) => patchNode(selNode.nodeId, { position: v })} />
          <Vec3 label="Rotation bias° (x / y / z)" value={selNode.rotation} onChange={(v) => patchNode(selNode.nodeId, { rotation: v })} step={5} />
          <div className="grid grid-cols-4 gap-1.5">
            <NumRow label="Speed" value={selNode.speed} step={1} min={0.5} onChange={(v) => patchNode(selNode.nodeId, { speed: v })} />
            <NumRow label="Duration" value={selNode.duration ?? 0} step={0.25} min={0} onChange={(v) => patchNode(selNode.nodeId, { duration: v || undefined })} />
            <NumRow label="Wait (s)" value={selNode.waitTime} step={0.25} min={0} onChange={(v) => patchNode(selNode.nodeId, { waitTime: v })} />
            <NumRow label="Bank°" value={selNode.bankingAngle} step={5} onChange={(v) => patchNode(selNode.nodeId, { bankingAngle: v })} />
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <NumRow label="Altitude (Y)" value={selNode.altitude ?? 0} step={1} onChange={(v) => patchNode(selNode.nodeId, { altitude: v || undefined })} />
            <NumRow label="Influence R" value={selNode.influenceRadius ?? 8} step={1} min={0} onChange={(v) => patchNode(selNode.nodeId, { influenceRadius: v })} />
            <SelectRow label="Flight pose" value={selNode.flightPose} options={FLIGHT_POSES.map((p) => ({ value: p, label: p }))} onChange={(v) => patchNode(selNode.nodeId, { flightPose: v as FlightPathNode['flightPose'] })} />
          </div>
          <SelectRow label="Camera target (keyframe)" value={selNode.cameraTargetId ?? ''} options={[{ value: '', label: '— none —' }, ...phase.cameraKeyframes.map((k) => ({ value: k.keyframeId, label: `${k.time.toFixed(1)}s` }))]} onChange={(v) => patchNode(selNode.nodeId, { cameraTargetId: v || undefined })} />
          <NodeCameraPanel phase={phase} node={selNode} />
          {/* Curve handles — only shape the path in bezier mode; Manual seeds them from neighbours, Auto clears. */}
          {path.curveType === 'bezier' && (
            <div className="mt-1 space-y-1 rounded border border-fuchsia-800/40 bg-slate-950/40 p-1.5">
              <div className="flex items-center justify-between">
                <span className={lbl}>Curve handles</span>
                <div className="flex gap-1">
                  <button onClick={() => { const { inn, out } = neighbourHandles(selNode.nodeId); patchNode(selNode.nodeId, { handleIn: selNode.handleIn ?? inn, handleOut: selNode.handleOut ?? out }); }} className="rounded bg-fuchsia-700/30 px-2 py-0.5 text-[10px] text-fuchsia-100 hover:bg-fuchsia-700/50">Manual</button>
                  <button onClick={() => patchNode(selNode.nodeId, { handleIn: undefined, handleOut: undefined })} className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-200 hover:bg-slate-700">Auto-smooth</button>
                </div>
              </div>
              {selNode.handleIn && <Vec3 label="Handle In (relative)" value={selNode.handleIn} onChange={(v) => patchNode(selNode.nodeId, { handleIn: v })} />}
              {selNode.handleOut && <Vec3 label="Handle Out (relative)" value={selNode.handleOut} onChange={(v) => patchNode(selNode.nodeId, { handleOut: v })} />}
              {!selNode.handleIn && !selNode.handleOut && <p className="text-[10px] text-slate-500">Auto (Catmull) tangents. Click Manual to add draggable bezier handles in 3D.</p>}
            </div>
          )}
          <div className="mt-1 flex gap-1">
            <button onClick={() => { const id = store.duplicateNode(phase.phaseId, selNode.nodeId); if (id) tl.selectNode(id); }} className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-200 hover:bg-slate-700">⧉ Duplicate</button>
            <button onClick={() => store.removeNode(phase.phaseId, selNode.nodeId)} className="rounded bg-rose-700/25 px-2 py-0.5 text-[10px] text-rose-200 hover:bg-rose-700/40">✕ Delete</button>
          </div>
        </section>
      )}

      {/* 3 — Camera Keyframe Panel */}
      <section className="rounded border border-fuchsia-700/40 bg-fuchsia-950/15 p-2">
        <div className="mb-1 flex items-center justify-between">
          <span className={lbl}>🎥 Camera keyframes · {phase.cameraKeyframes.length}</span>
          <button onClick={() => { const id = store.addCameraKey(phase.phaseId, tl.currentTime); if (id) tl.selectKeyframe(id); }} className="rounded bg-fuchsia-700/30 px-2 py-0.5 text-[10px] text-fuchsia-100 hover:bg-fuchsia-700/50">+ @ {tl.currentTime.toFixed(1)}s</button>
        </div>
        <div className="space-y-0.5">
          {phase.cameraKeyframes.map((k) => (
            <div key={k.keyframeId} className={`flex items-center gap-1 rounded border px-1.5 py-0.5 ${tl.selectedKeyframeId === k.keyframeId ? 'border-fuchsia-500/70 bg-fuchsia-950/30' : 'border-slate-800 bg-slate-900/50'}`}>
              <button onClick={() => selectKey(k)} className="flex-1 text-left text-[11px] text-slate-200 hover:text-fuchsia-200">🎥 {k.time.toFixed(2)}s {k.followTargetId === 'craft' ? '· follow craft' : ''}</button>
              <button onClick={() => store.removeCameraKey(phase.phaseId, k.keyframeId)} className="rounded bg-rose-800/40 px-1 text-[10px] text-rose-200 hover:bg-rose-800/60">✕</button>
            </div>
          ))}
        </div>
        {selKey && selKey.nodeId && (
          <p className="mt-1 rounded bg-slate-900/60 px-2 py-1 text-[10px] text-slate-400">🎥 This camera is bound to node <b className="text-fuchsia-200">{path.nodes.find((n) => n.nodeId === selKey.nodeId)?.nodeName ?? selKey.nodeId}</b> — edit it in the node's <b>🎥 Node camera</b> panel above.</p>
        )}
        {selKey && !selKey.nodeId && (
          <div className="mt-1 space-y-1 rounded border border-fuchsia-800/40 bg-slate-950/40 p-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              <NumRow label="Time (s)" value={selKey.time} step={0.1} min={0} onChange={(v) => store.updateCameraKey(phase.phaseId, selKey.keyframeId, { time: v })} />
              <NumRow label="FOV" value={selKey.fov} step={1} min={10} max={120} onChange={(v) => store.updateCameraKey(phase.phaseId, selKey.keyframeId, { fov: v })} />
            </div>
            <Vec3 label="Position (x / y / z)" value={selKey.position} onChange={(v) => store.updateCameraKey(phase.phaseId, selKey.keyframeId, { position: v })} />
            <Vec3 label="Look-at target (x / y / z)" value={selKey.lookAtTarget ?? [0, 0, 0]} onChange={(v) => store.updateCameraKey(phase.phaseId, selKey.keyframeId, { lookAtTarget: v })} />
            <div className="grid grid-cols-2 gap-1.5">
              <SelectRow label="Transition" value={selKey.transitionType} options={FLIGHT_TRANSITIONS.map((t) => ({ value: t, label: t }))} onChange={(v) => store.updateCameraKey(phase.phaseId, selKey.keyframeId, { transitionType: v as FlightCameraKeyframe['transitionType'] })} />
              <SelectRow label="Follow target" value={selKey.followTargetId ?? ''} options={[{ value: '', label: 'fixed world shot' }, { value: 'craft', label: 'craft' }]} onChange={(v) => store.updateCameraKey(phase.phaseId, selKey.keyframeId, { followTargetId: v || undefined })} />
            </div>
            <button onClick={() => { tl.scrub(selKey.time); if (!tl.cameraPreview) tl.toggleCameraPreview(); }} className="w-full rounded bg-fuchsia-700/30 px-2 py-0.5 text-[10px] text-fuchsia-100 hover:bg-fuchsia-700/50">👁 Preview camera @ {selKey.time.toFixed(1)}s</button>
          </div>
        )}
      </section>

      {/* 4 — Timeline Event Panel */}
      <section className="rounded border border-amber-700/40 bg-amber-950/10 p-2">
        <div className="mb-1 flex items-center justify-between">
          <span className={lbl}>⚡ Events · {phase.events.length}</span>
          <button onClick={() => { const id = store.addEvent(phase.phaseId, tl.currentTime); if (id) tl.selectEvent(id); }} className="rounded bg-amber-700/30 px-2 py-0.5 text-[10px] text-amber-100 hover:bg-amber-700/50">+ @ {tl.currentTime.toFixed(1)}s</button>
        </div>
        <div className="space-y-0.5">
          {phase.events.map((e) => (
            <div key={e.eventId} className={`flex items-center gap-1 rounded border px-1.5 py-0.5 ${tl.selectedEventId === e.eventId ? 'border-amber-500/70 bg-amber-950/30' : 'border-slate-800 bg-slate-900/50'} ${e.enabled ? '' : 'opacity-50'}`}>
              <button onClick={() => { tl.selectEvent(e.eventId); tl.scrub(e.time); }} className="flex-1 text-left text-[11px] text-slate-200 hover:text-amber-200">⚡ {e.time.toFixed(2)}s · {e.eventType}</button>
              <button onClick={() => store.removeEvent(phase.phaseId, e.eventId)} className="rounded bg-rose-800/40 px-1 text-[10px] text-rose-200 hover:bg-rose-800/60">✕</button>
            </div>
          ))}
        </div>
        {selEvent && (
          <div className="mt-1 space-y-1 rounded border border-amber-800/40 bg-slate-950/40 p-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              <NumRow label="Time (s)" value={selEvent.time} step={0.1} min={0} onChange={(v) => store.updateEvent(phase.phaseId, selEvent.eventId, { time: v })} />
              <SelectRow label="Type" value={selEvent.eventType} options={FLIGHT_EVENT_TYPES.map((t) => ({ value: t, label: t }))} onChange={(v) => store.updateEvent(phase.phaseId, selEvent.eventId, { eventType: v as FlightTimelineEvent['eventType'] })} />
            </div>
            <TextRow label="Payload text (briefing / dialogue / warning)" value={typeof selEvent.payload.text === 'string' ? selEvent.payload.text : ''} onChange={(v) => store.updateEvent(phase.phaseId, selEvent.eventId, { payload: { ...selEvent.payload, text: v } })} />
            <div className="flex flex-wrap gap-3 text-[11px] text-slate-300">
              <label className="flex items-center gap-1"><input type="checkbox" checked={selEvent.enabled} onChange={(e) => store.updateEvent(phase.phaseId, selEvent.eventId, { enabled: e.target.checked })} className="accent-amber-500" /> Enabled</label>
              <label className="flex items-center gap-1"><input type="checkbox" checked={selEvent.previewEnabled} onChange={(e) => store.updateEvent(phase.phaseId, selEvent.eventId, { previewEnabled: e.target.checked })} className="accent-amber-500" /> Preview</label>
              <label className="flex items-center gap-1"><input type="checkbox" checked={selEvent.triggerOnce} onChange={(e) => store.updateEvent(phase.phaseId, selEvent.eventId, { triggerOnce: e.target.checked })} className="accent-amber-500" /> Once</label>
            </div>
            <button onClick={() => { tl.scrub(selEvent.time); fireFlightEvent(selEvent, false); }} className="w-full rounded bg-amber-700/30 px-2 py-0.5 text-[10px] text-amber-100 hover:bg-amber-700/50">▶ Preview event</button>
          </div>
        )}
      </section>

      {/* 5 — View Tools Panel */}
      <section className="rounded border border-slate-700/50 bg-slate-900/40 p-2">
        <div className={lbl}>🧭 View tools</div>
        <div className="mt-1 flex flex-wrap gap-1">
          {FLIGHT_VIEW_MODES.map((m) => (
            <button key={m} onClick={() => tl.setViewMode(m as FlightViewMode)} className={`rounded px-2 py-0.5 text-[11px] capitalize ${tl.viewMode === m ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{m}</button>
          ))}
        </div>
        <div className="mt-1 flex flex-wrap gap-1">
          <button onClick={() => { if (selNode) selectNode(selNode); }} disabled={!selNode} className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-200 hover:bg-slate-700 disabled:opacity-40">Frame selected</button>
          <button onClick={() => tl.setViewMode('overview')} className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-200 hover:bg-slate-700">Frame entire path</button>
        </div>
        <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-slate-300">
          <label className="flex items-center gap-1"><input type="checkbox" checked={tl.showPathGizmos} onChange={() => tl.toggleGizmo('path')} className="accent-sky-500" /> Path gizmos</label>
          <label className="flex items-center gap-1"><input type="checkbox" checked={tl.showCameraGizmos} onChange={() => tl.toggleGizmo('camera')} className="accent-fuchsia-500" /> Camera gizmos</label>
          <label className="flex items-center gap-1"><input type="checkbox" checked={tl.showEventMarkers} onChange={() => tl.toggleGizmo('event')} className="accent-amber-500" /> Event markers</label>
        </div>
      </section>
    </div>
  );
};
