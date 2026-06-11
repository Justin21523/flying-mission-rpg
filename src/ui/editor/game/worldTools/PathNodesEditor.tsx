import { useEditorPathStore } from '../../../../stores/editorPathStore';
import { useWorldSelectStore } from '../../../../stores/worldSelectStore';
import { focusCameraOn } from '../../../../game/edit/cameraFocus';
import type { PathCurveType, PathDirectionMode, PathNodeData } from '../../../../types/path';
import { TextRow, NumRow, SelectRow } from '../CollectionEditor';
import { Field, inp, lbl, MoveButtons } from '../../editorShared';
import { useFlightPreviewStore } from '../../../../stores/game/flightPreviewStore';

// Reusable path-node editor for ANY editorPathStore path (the world route path AND the base fly-around loop).
// The 3D node handles (PathDebugLayer) drag → updatePathNode live; this mirrors them (position + rich per-node
// flight params: width / speed× / Bank° / tangent / wait) and adds/removes/focuses nodes. Selection drives
// the gizmo via worldSelectStore; the matching row highlights. `onCreatePath` handles the empty-path case.
const CURVE_TYPES: PathCurveType[] = ['catmullRom', 'bezier', 'linear'];
const DIRECTIONS: PathDirectionMode[] = ['oneWay', 'twoWay'];
const num = (value: string, fallback = 0) => { const p = parseFloat(value); return Number.isNaN(p) ? fallback : p; };

export const PathNodesEditor = ({ pathId, onCreatePath, createLabel = 'Create path' }: { pathId?: string; onCreatePath?: () => void; createLabel?: string }) => {
  const paths = useEditorPathStore((s) => s.paths);
  const path = paths.find((p) => p.id === pathId);
  const selectedKey = useWorldSelectStore((s) => s.selectedKey);
  const store = useEditorPathStore.getState();

  // Seek the flight preview to a node's progress (u ≈ index/(count-1)) so an edit there is visible at that point.
  const seekToNode = (nodeId: string) => {
    const ns = path?.nodes ?? [];
    const i = ns.findIndex((n) => n.id === nodeId);
    if (i >= 0 && ns.length > 1) useFlightPreviewStore.getState().scrub(i / (ns.length - 1));
  };
  const selectNode = (pid: string, node: PathNodeData) => {
    useWorldSelectStore.getState().select(`${pid}#node#${node.id}`);
    focusCameraOn(node.position[0], node.position[1], node.position[2]);
    seekToNode(node.id);
  };

  if (!path) {
    return (
      <div className="rounded border border-amber-700/40 bg-amber-950/15 p-2">
        <div className={lbl}>Flight path nodes</div>
        <p className="mb-1 text-[10px] text-slate-500">No path yet. Create one to edit control nodes here and in the 3D view.</p>
        {onCreatePath && <button onClick={onCreatePath} className="rounded bg-emerald-700/30 px-2 py-0.5 text-[11px] text-emerald-100 hover:bg-emerald-700/50">{createLabel}</button>}
      </div>
    );
  }
  const nodes = path.nodes ?? [];
  const patchNode = (nodeId: string, patch: Partial<PathNodeData>) => { store.updateNode(path.id, nodeId, patch); seekToNode(nodeId); };
  return (
    <div className="space-y-1.5 rounded border border-sky-700/40 bg-sky-950/15 p-2">
      <div className="flex items-center justify-between gap-2">
        <div className={lbl}>Flight path nodes · {nodes.length}</div>
        <button onClick={() => store.addNode(path.id)} className="rounded bg-sky-700/30 px-2 py-0.5 text-[11px] text-sky-100 hover:bg-sky-700/50">+ Node</button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <TextRow label="Path name" value={path.name} onChange={(v) => store.updatePath(path.id, { name: v })} />
        <Field label="Area">
          <input value={path.areaId ?? 'world'} onChange={(e) => store.updatePath(path.id, { areaId: e.target.value || 'world' })} className={inp} />
        </Field>
        <SelectRow label="Curve type" value={path.curveType} options={CURVE_TYPES.map((v) => ({ value: v, label: v }))} onChange={(v) => store.updatePath(path.id, { curveType: v as PathCurveType })} />
        <SelectRow label="Direction" value={path.directionMode} options={DIRECTIONS.map((v) => ({ value: v, label: v }))} onChange={(v) => store.updatePath(path.id, { directionMode: v as PathDirectionMode })} />
        <NumRow label="Default speed" value={path.defaultSpeed} step={0.5} min={0.5} onChange={(v) => store.updatePath(path.id, { defaultSpeed: v })} />
        <NumRow label="Lane width" value={path.laneWidth} step={0.5} min={0.1} onChange={(v) => store.updatePath(path.id, { laneWidth: v })} />
      </div>
      <div className="space-y-1">
        {nodes.map((node, index) => (
          <div key={node.id} className={`rounded border p-1.5 ${selectedKey === `${path.id}#node#${node.id}` ? 'border-violet-500/70 bg-violet-950/30' : 'border-slate-800 bg-slate-900/55'}`}>
            <div className="mb-1 flex items-center gap-1">
              <span className="w-6 text-center text-[11px] font-bold text-sky-200">{index + 1}</span>
              <button onClick={() => selectNode(path.id, node)} className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-sky-200 hover:bg-slate-700">Focus</button>
              <MoveButtons index={index} count={nodes.length} onMove={(d) => store.reorderNode(path.id, node.id, d)} />
              <button onClick={() => store.removeNode(path.id, node.id)} className="ml-auto rounded bg-rose-700/20 px-2 py-0.5 text-[10px] text-rose-300 hover:bg-rose-700/30">Remove</button>
            </div>
            <Field label="Position (x / y / z) — live with the 3D node handle">
              <div className="flex gap-1">
                {([0, 1, 2] as const).map((axis) => (
                  <input
                    key={axis}
                    type="number"
                    step={0.5}
                    value={Math.round(node.position[axis] * 100) / 100}
                    onChange={(e) => {
                      const next = [...node.position] as [number, number, number];
                      next[axis] = num(e.target.value);
                      patchNode(node.id, { position: next });
                    }}
                    className={inp + ' w-0 flex-1 text-center'}
                  />
                ))}
              </div>
            </Field>
            <div className="grid grid-cols-4 gap-1.5">
              <NumRow label="Width" value={node.width} step={0.1} min={0.1} onChange={(v) => patchNode(node.id, { width: v })} />
              <NumRow label="Speed ×" value={node.speedMultiplier} step={0.1} min={0} onChange={(v) => patchNode(node.id, { speedMultiplier: v })} />
              <NumRow label="Bank°" value={node.bankDeg ?? 0} step={5} onChange={(v) => patchNode(node.id, { bankDeg: v || undefined })} />
              <NumRow label="Wait (s)" value={node.waitTime ?? 0} step={0.25} min={0} onChange={(v) => patchNode(node.id, { waitTime: v || undefined })} />
            </div>
            <Field label="Tangent">
              <select value={node.tangentMode} onChange={(e) => patchNode(node.id, { tangentMode: e.target.value as PathNodeData['tangentMode'] })} className={inp}>
                <option value="automatic">automatic</option>
                <option value="linear">linear</option>
                <option value="custom">custom</option>
              </select>
            </Field>
          </div>
        ))}
      </div>
    </div>
  );
};
