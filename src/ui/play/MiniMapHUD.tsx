import { usePlayerStore } from '../../stores/playerStore';
import { getWorldArea } from '../../stores/editorWorldStore';
import { resolveAreaTheme } from '../../game/environment/areaBiome';
import { getKitArea } from '../../data/areas';
import type { EdgeDir } from '../../types/world';

// POLI — 🧭 compass HUD (top-right). Shows the current area (tinted by its biome) and the neighbouring
// areas on each edge (N/S/E/W) so you can see where walking off each side leads. Updates on area change.
const EDGE_POS: Record<EdgeDir, string> = {
  north: 'left-1/2 top-1 -translate-x-1/2',
  south: 'left-1/2 bottom-1 -translate-x-1/2',
  east: 'right-1 top-1/2 -translate-y-1/2',
  west: 'left-1 top-1/2 -translate-y-1/2',
};
const EDGE_ARROW: Record<EdgeDir, string> = { north: '↑', south: '↓', east: '→', west: '←' };
const EDGES: EdgeDir[] = ['north', 'south', 'east', 'west'];

export const MiniMapHUD = () => {
  const areaId = usePlayerStore((s) => s.currentAreaId);
  const area = getWorldArea(areaId);
  const theme = resolveAreaTheme(areaId);
  const edges = area?.edges ?? {};

  return (
    <div className="pointer-events-none absolute right-3 top-3 z-[70] w-44 rounded-xl border border-slate-700/50 bg-slate-950/70 p-2 text-slate-200 shadow-xl backdrop-blur-md">
      <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold text-cyan-100">
        <span className="inline-block h-3 w-3 rounded-full border border-white/40" style={{ background: theme.groundColor }} />
        🧭 {area?.name ?? areaId}
      </div>
      <div className="relative h-28 rounded-lg" style={{ background: theme.fogColor + '33' }}>
        {/* player dot */}
        <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400 shadow ring-2 ring-emerald-300/40" />
        {/* edge exits (where each side leads) */}
        {EDGES.map((dir) => {
          const n = edges[dir];
          return (
            <div key={dir} className={`absolute ${EDGE_POS[dir]} max-w-[84px] truncate rounded px-1 text-[9px] ${n ? 'bg-emerald-800/80 text-emerald-100' : 'bg-slate-800/70 text-slate-500'}`}>
              {EDGE_ARROW[dir]} {n ? (getKitArea(n)?.name ?? n) : '—'}
            </div>
          );
        })}
      </div>
      <div className="mt-1 text-[9px] leading-tight text-slate-500">走到邊緣即可前往鄰區</div>
    </div>
  );
};
