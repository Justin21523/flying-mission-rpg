import { useEditorLocationStore } from '../../../../stores/game/editorLocationStore';
import { useEditorPathStore } from '../../../../stores/editorPathStore';
import { useWorldSelectStore } from '../../../../stores/worldSelectStore';
import { focusCameraOn } from '../../../../game/edit/cameraFocus';
import type { FlightRoute } from '../../../../types/game/flight';
import type { WorldLocation } from '../../../../types/game/world';
import { lbl } from '../../editorShared';

// Route endpoints preview + camera focus. Shows the from/to WorldLocation info and focuses the edit camera
// on the route start / end (the location's 3D coordinate) or the currently selected path node — reusing the
// existing focusCameraOn bus (no scripted/locked camera; the user keeps control).
const LocationCard = ({ title, loc, onFocus }: { title: string; loc?: WorldLocation; onFocus?: () => void }) => (
  <div className="rounded border border-slate-800 bg-slate-900/55 p-2">
    <div className="flex items-center justify-between">
      <div className={lbl}>{title}</div>
      {loc && onFocus && <button onClick={onFocus} className="rounded bg-sky-700/30 px-2 py-0.5 text-[10px] text-sky-100 hover:bg-sky-700/50">🎯 Focus</button>}
    </div>
    {loc ? (
      <div className="mt-1 text-[11px] text-slate-300">
        <div className="font-semibold text-slate-100">{loc.name} <span className="text-[10px] text-slate-500">· {loc.kind}</span></div>
        {loc.description && <div className="text-[10px] text-slate-400">{loc.description}</div>}
        <div className="mt-0.5 font-mono text-[10px] text-slate-500">[{loc.coordinate.x.toFixed(0)}, {loc.coordinate.y.toFixed(0)}, {loc.coordinate.z.toFixed(0)}]</div>
      </div>
    ) : (
      <div className="mt-1 text-[11px] text-slate-500">No location set (pick one in the Route sub-tab).</div>
    )}
  </div>
);

export const LocationPreview = ({ route }: { route: FlightRoute }) => {
  const locations = useEditorLocationStore((s) => s.items);
  const paths = useEditorPathStore((s) => s.paths);
  const selectedKey = useWorldSelectStore((s) => s.selectedKey);
  const from = locations.find((l) => l.id === route.fromLocationId);
  const to = locations.find((l) => l.id === route.toLocationId);
  const focusLoc = (l?: WorldLocation) => { if (l) focusCameraOn(l.coordinate.x, l.coordinate.y, l.coordinate.z); };

  const focusSelectedNode = () => {
    if (!selectedKey) return;
    const [pathId, kind, nodeId] = selectedKey.split('#');
    if (kind !== 'node') return;
    const node = paths.find((p) => p.id === pathId)?.nodes?.find((n) => n.id === nodeId);
    if (node) focusCameraOn(node.position[0], node.position[1], node.position[2]);
  };

  return (
    <div className="space-y-2">
      <LocationCard title="Route start (from)" loc={from} onFocus={() => focusLoc(from)} />
      <LocationCard title="Route end (to)" loc={to} onFocus={() => focusLoc(to)} />
      <button onClick={focusSelectedNode} disabled={!selectedKey?.includes('#node#')} className="w-full rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-700 disabled:opacity-40">
        🎯 Focus selected path node
      </button>
    </div>
  );
};
