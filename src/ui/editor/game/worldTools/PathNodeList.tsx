import { useEditorPathStore } from '../../../../stores/editorPathStore';
import { useWorldSelectStore } from '../../../../stores/worldSelectStore';
import { focusCameraOn } from '../../../../game/edit/cameraFocus';
import type { FlightRoute } from '../../../../types/game/flight';
import type { PathCurveType, PathDirectionMode, PathNodeData } from '../../../../types/path';
import { TextRow, NumRow, SelectRow } from '../CollectionEditor';
import { Field, inp, lbl } from '../../editorShared';

// Path-node editor for a route's 航道. The 3D node handles (PathDebugLayer, area 'world') drag → updatePathNode
// live; this list mirrors them (numeric position + width/speed/tangent/wait) and adds/removes/focuses nodes.
// If the route has no path yet, offer to create one. Selection drives the gizmo via worldSelectStore.
const CURVE_TYPES: PathCurveType[] = ['catmullRom', 'bezier', 'linear'];
const DIRECTIONS: PathDirectionMode[] = ['oneWay', 'twoWay'];
const num = (value: string, fallback = 0) => { const p = parseFloat(value); return Number.isNaN(p) ? fallback : p; };

export const PathNodeList = ({ route, update }: { route: FlightRoute; update: (patch: Partial<FlightRoute>) => void }) => {
  const paths = useEditorPathStore((s) => s.paths);
  const path = paths.find((p) => p.id === route.pathId);
  const store = useEditorPathStore.getState();

  const createPath = () => {
    const id = store.addPath('world');
    store.updatePath(id, { name: `${route.name} Path`, areaId: 'world', defaultSpeed: Math.max(1, route.virtualDistance / Math.max(1, route.estimatedFlightSec)) });
    update({ pathId: id });
  };
  const selectNode = (pathId: string, node: PathNodeData) => {
    useWorldSelectStore.getState().select(`${pathId}#node#${node.id}`);
    focusCameraOn(node.position[0], node.position[1], node.position[2]);
  };

  if (!path) {
    return (
      <div className="rounded border border-amber-700/40 bg-amber-950/15 p-2">
        <div className={lbl}>Flight path nodes</div>
        <p className="mb-1 text-[10px] text-slate-500">This route has no 航道 yet. Create a world path to edit route control nodes here and in the 3D view.</p>
        <button onClick={createPath} className="rounded bg-emerald-700/30 px-2 py-0.5 text-[11px] text-emerald-100 hover:bg-emerald-700/50">Create world path</button>
      </div>
    );
  }
  const nodes = path.nodes ?? [];
  const patchNode = (nodeId: string, p: Partial<PathNodeData>) => store.updateNode(path.id, nodeId, p);
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
          <div key={node.id} className="rounded border border-slate-800 bg-slate-900/55 p-1.5">
            <div className="mb-1 flex items-center gap-1">
              <span className="w-6 text-center text-[11px] font-bold text-sky-200">{index + 1}</span>
              <button onClick={() => selectNode(path.id, node)} className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-sky-200 hover:bg-slate-700">Focus</button>
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
              <Field label="Tangent">
                <select value={node.tangentMode} onChange={(e) => patchNode(node.id, { tangentMode: e.target.value as PathNodeData['tangentMode'] })} className={inp}>
                  <option value="automatic">automatic</option>
                  <option value="linear">linear</option>
                  <option value="custom">custom</option>
                </select>
              </Field>
              <NumRow label="Wait (s)" value={node.waitTime ?? 0} step={0.25} min={0} onChange={(v) => patchNode(node.id, { waitTime: v || undefined })} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
