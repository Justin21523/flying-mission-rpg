import { useEditorPathStore } from '../../../stores/editorPathStore';
import { useEditorRouteStore } from '../../../stores/game/editorRouteStore';
import { useFlightPreviewStore } from '../../../stores/game/flightPreviewStore';
import { useGameStore } from '../../../stores/game/useGameStore';
import { useWorldFlightEditorStore } from '../../../stores/game/worldFlightEditorStore';
import { useWorldSelectStore } from '../../../stores/worldSelectStore';
import { FLIGHT_PATH_ID } from '../../../data/game/flightPath';
import { getActiveRoute } from '../../../game/flight/world/worldRoute';
import { resolveFlightLeg, type FlightLegDirection } from '../../../game/flight/flightLeg';
import { flightTimelineInsertPoint, flightTimelineRouteNodeMarkers } from '../../../game/flight/flightTimelineRouteNodes';
import { focusCameraOn } from '../../../game/edit/cameraFocus';
import type { PathDefinition, PathNodeData } from '../../../types/path';
import { Field, inp, lbl } from '../editorShared';
import { NumRow } from './CollectionEditor';

const num = (value: string, fallback = 0) => {
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

function activeTimelinePath(
  paths: PathDefinition[],
  routes: ReturnType<typeof useEditorRouteStore.getState>['items'],
  phase: string,
  selectedRouteId: string | null,
  selectedLeg: 'outbound' | 'return',
): { path: PathDefinition | undefined; direction: FlightLegDirection; label: string } {
  const worldPhase = phase === 'WORLD_FLIGHT' || phase === 'RETURN_FLIGHT';
  if (!worldPhase) {
    return { path: paths.find((path) => path.id === FLIGHT_PATH_ID), direction: 'forward', label: 'base fly-around' };
  }
  const route = routes.find((item) => item.id === selectedRouteId) ?? getActiveRoute();
  const leg = resolveFlightLeg(route, selectedLeg);
  return { path: paths.find((path) => path.id === leg.pathId), direction: leg.direction, label: `${selectedLeg} · ${leg.pathId}` };
}

export const FlightRouteNodeTimeline = () => {
  const paths = useEditorPathStore((s) => s.paths);
  const routes = useEditorRouteStore((s) => s.items);
  const selectedKey = useWorldSelectStore((s) => s.selectedKey);
  const phase = useGameStore((s) => s.phase);
  const selectedRouteId = useWorldFlightEditorStore((s) => s.selectedRouteId);
  const selectedLeg = useWorldFlightEditorStore((s) => s.selectedLeg);
  const u = useFlightPreviewStore((s) => s.u);
  const store = useEditorPathStore.getState();
  const { path, direction, label } = activeTimelinePath(paths, routes, phase, selectedRouteId, selectedLeg);
  const markers = flightTimelineRouteNodeMarkers(path, direction).sort((a, b) => a.timelineU - b.timelineU);
  const selectedNode = path?.nodes?.find((node) => selectedKey === `${path.id}#node#${node.id}`);

  const selectNode = (node: PathNodeData) => {
    if (!path) return;
    const marker = markers.find((item) => item.id === node.id);
    useWorldSelectStore.getState().select(`${path.id}#node#${node.id}`);
    focusCameraOn(node.position[0], node.position[1], node.position[2]);
    useFlightPreviewStore.getState().scrub(marker?.timelineU ?? 0);
  };
  const patchNode = (nodeId: string, patch: Partial<PathNodeData>) => {
    if (!path) return;
    store.updateNode(path.id, nodeId, patch);
  };
  const addAtScrub = () => {
    if (!path) return;
    const insert = flightTimelineInsertPoint(path, u, direction);
    if (!insert) return;
    store.insertNodeAt(path.id, insert.index, insert.position);
    useFlightPreviewStore.getState().scrub(u);
  };

  return (
    <div className="mt-2 rounded border border-cyan-700/40 bg-cyan-950/15 p-2">
      <div className="flex items-center justify-between gap-2">
        <div className={lbl}>Route nodes · {markers.length}</div>
        <span className="font-mono text-[10px] text-slate-500">{label}</span>
      </div>
      {!path ? (
        <div className="mt-1 text-[11px] text-slate-500">No path is mounted for this flight timeline.</div>
      ) : (
        <>
          <div className="mt-2">
            <div className="relative h-8 rounded bg-slate-900/80">
              <div className="absolute left-0 right-0 top-1/2 h-px bg-slate-700" />
              <div className="absolute top-0 h-8 w-px bg-sky-300" style={{ left: `${u * 100}%` }} />
              {markers.map((marker) => {
                const key = `${path.id}#node#${marker.id}`;
                const selected = selectedKey === key;
                return (
                  <button
                    key={marker.id}
                    onClick={() => {
                      const node = path.nodes?.find((item) => item.id === marker.id);
                      if (node) selectNode(node);
                    }}
                    className={`absolute top-1 h-6 min-w-6 -translate-x-1/2 rounded px-1 text-[10px] font-semibold ${
                      selected ? 'bg-violet-500 text-white' : 'bg-cyan-700/70 text-cyan-50 hover:bg-cyan-600'
                    }`}
                    style={{ left: `${marker.timelineU * 100}%` }}
                    title={`Node ${marker.label} · u ${Math.round(marker.timelineU * 100)}%`}
                  >
                    {marker.label}
                  </button>
                );
              })}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1">
              <button onClick={addAtScrub} className="rounded bg-emerald-700/30 px-2 py-0.5 text-[10px] text-emerald-100 hover:bg-emerald-700/50">+ Node at scrub</button>
              <span className="text-[10px] text-slate-500">Select a marker, then drag its numbered 3D gizmo to reshape the route.</span>
            </div>
          </div>

          {selectedNode ? (
            <div className="mt-2 rounded border border-violet-700/50 bg-violet-950/15 p-1.5">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-violet-100">Selected node</span>
                <button onClick={() => store.removeNode(path.id, selectedNode.id)} className="rounded bg-rose-700/20 px-2 py-0.5 text-[10px] text-rose-300 hover:bg-rose-700/30">Remove</button>
              </div>
              <Field label="Position (x / y / z)">
                <div className="flex gap-1">
                  {([0, 1, 2] as const).map((axis) => (
                    <input
                      key={axis}
                      type="number"
                      step={0.5}
                      value={Math.round(selectedNode.position[axis] * 100) / 100}
                      onChange={(e) => {
                        const position = [...selectedNode.position] as [number, number, number];
                        position[axis] = num(e.target.value);
                        patchNode(selectedNode.id, { position });
                      }}
                      className={`${inp} w-0 flex-1 text-center`}
                    />
                  ))}
                </div>
              </Field>
              <div className="grid grid-cols-4 gap-1.5">
                <NumRow label="Width" value={selectedNode.width} step={0.1} min={0.1} onChange={(width) => patchNode(selectedNode.id, { width })} />
                <NumRow label="Speed multiplier" value={selectedNode.speedMultiplier} step={0.1} min={0} onChange={(speedMultiplier) => patchNode(selectedNode.id, { speedMultiplier })} />
                <NumRow label="Bank deg" value={selectedNode.bankDeg ?? 0} step={5} onChange={(bankDeg) => patchNode(selectedNode.id, { bankDeg: bankDeg || undefined })} />
                <Field label="Tangent">
                  <select value={selectedNode.tangentMode} onChange={(e) => patchNode(selectedNode.id, { tangentMode: e.target.value as PathNodeData['tangentMode'] })} className={inp}>
                    <option value="automatic">automatic</option>
                    <option value="linear">linear</option>
                    <option value="custom">custom</option>
                  </select>
                </Field>
              </div>
            </div>
          ) : (
            <div className="mt-1 text-[10px] text-slate-500">No route node selected.</div>
          )}
        </>
      )}
    </div>
  );
};
