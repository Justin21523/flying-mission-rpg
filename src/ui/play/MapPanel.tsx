import { usePlayerStore } from '../../stores/playerStore';
import { getWorldAreas } from '../../stores/editorWorldStore';
import { getKitArea } from '../../data/areas';
import { resolveAreaTheme } from '../../game/environment/areaBiome';
import type { EdgeDir, WorldArea } from '../../types/world';
import { MAP_POINT_ICON } from '../../types/world';
import { PanelCard, closePanel } from './playShared';
import { useT } from '../../i18n/useT';

// POLI — 🗺 World Map: a clickable GRID laid out from each area's edge links (east=+col, west=-col,
// south=+row, north=-row) so the spatial relationship between areas is visible at a glance. The current
// area is highlighted; clicking any area teleports there (the map is the one allowed fast-travel).
const EDGE_OFFSET: Record<EdgeDir, [number, number]> = {
  east: [1, 0], west: [-1, 0], south: [0, 1], north: [0, -1],
};

interface Cell { area: WorldArea; c: number; r: number }

function buildGrid(areas: WorldArea[]): { cells: Cell[]; cols: number; rows: number } {
  const byId = new Map(areas.map((a) => [a.id, a]));
  const coord = new Map<string, [number, number]>();
  // BFS from the first area, placing neighbours by their edge direction.
  if (areas.length) {
    coord.set(areas[0].id, [0, 0]);
    const q = [areas[0].id];
    while (q.length) {
      const cur = q.shift()!;
      const [c, r] = coord.get(cur)!;
      const edges = byId.get(cur)?.edges ?? {};
      for (const dir of Object.keys(edges) as EdgeDir[]) {
        const n = edges[dir];
        if (!n || coord.has(n) || !byId.has(n)) continue;
        const [dc, dr] = EDGE_OFFSET[dir];
        coord.set(n, [c + dc, r + dr]);
        q.push(n);
      }
    }
  }
  // Any area not reached by edges → append on a new row below.
  let extraRow = (coord.size ? Math.max(...[...coord.values()].map(([, r]) => r)) : 0) + 2;
  let extraCol = 0;
  for (const a of areas) if (!coord.has(a.id)) { coord.set(a.id, [extraCol++, extraRow]); if (extraCol > 4) { extraCol = 0; extraRow++; } }
  const cs = [...coord.values()];
  const minC = Math.min(...cs.map(([c]) => c)); const maxC = Math.max(...cs.map(([c]) => c));
  const minR = Math.min(...cs.map(([, r]) => r)); const maxR = Math.max(...cs.map(([, r]) => r));
  const cells: Cell[] = areas.filter((a) => coord.has(a.id)).map((a) => {
    const [c, r] = coord.get(a.id)!; return { area: a, c: c - minC, r: r - minR };
  });
  return { cells, cols: maxC - minC + 1, rows: maxR - minR + 1 };
}

export const MapPanel = () => {
  const current = usePlayerStore((s) => s.currentAreaId);
  const t = useT();
  const areas = getWorldAreas();
  const { cells, cols, rows } = buildGrid(areas);
  const travel = (id: string) => {
    const sp = getKitArea(id)?.spawnPoint ?? { x: 0, y: 3, z: 0 };
    usePlayerStore.getState().travelToArea(id, sp);
    closePanel();
  };
  return (
    <PanelCard title={t('panel_map')} icon="🗺" onClose={closePanel} width="32rem">
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, 3.5rem)` }}>
        {cells.map(({ area, c, r }) => {
          const here = area.id === current;
          const theme = resolveAreaTheme(area.id);
          return (
            <button
              key={area.id}
              onClick={() => !here && travel(area.id)}
              title={area.name}
              style={{ gridColumn: c + 1, gridRow: r + 1, background: theme.groundColor + (here ? 'ee' : '99'), borderColor: here ? '#22d3ee' : 'rgba(255,255,255,0.15)' }}
              className={`flex flex-col items-center justify-center overflow-hidden rounded-lg border p-1 text-center text-[10px] font-semibold text-white shadow transition-transform hover:scale-[1.03] ${here ? 'ring-2 ring-cyan-300' : ''}`}
            >
              <span className="leading-tight">{here ? '📍 ' : ''}{area.name}</span>
              <span className="text-[8px] font-normal text-white/70">{area.biome ?? ''}</span>
              {(area.points?.length ?? 0) > 0 && (
                <span className="mt-0.5 flex gap-0.5 text-[8px] leading-none">
                  {area.points!.slice(0, 6).map((p) => <span key={p.id} title={p.name}>{MAP_POINT_ICON[p.type]}</span>)}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[10px] text-slate-400">{t('map_footer')}</p>
    </PanelCard>
  );
};
