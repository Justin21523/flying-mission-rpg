import { usePlayerStore } from '../../stores/playerStore';
import { getWorldArea } from '../../stores/editorWorldStore';
import { getEffectiveAreaSize } from '../../game/world/areaExtent';
import { useEditorNpcStore } from '../../stores/editorNpcStore';
import { useIncidentStore } from '../../stores/incidentStore';
import { useEditorBoostStore } from '../../stores/editorBoostStore';
import { computePickupPositions } from '../../game/poli/pickupScatter';
import { resolveAreaTheme } from '../../game/environment/areaBiome';
import { getKitArea } from '../../data/areas';
import type { EdgeDir } from '../../types/world';
import { MAP_POINT_COLOR } from '../../types/world';
import { usePoll } from '../usePoll';

// POLI — 🛰 radar/detector HUD (top-centre). A live top-down scope: the player at the centre, nearby NPCs
// (cyan), active incidents (red), pickups (gold) and edge exits (green arrows) plotted relative to the
// player, with a rotating sweep. Area-tinted; updates ~7×/s (polled, not per-frame subscribed).
const R = 62;            // radar pixel radius
const RANGE_PAD = 6;
const EDGE_ANGLE: Record<EdgeDir, number> = { north: -90, south: 90, east: 0, west: 180 };
const EDGE_ARROW: Record<EdgeDir, string> = { north: '↑', south: '↓', east: '→', west: '←' };

const Dot = ({ x, z, scale, color, size = 6 }: { x: number; z: number; scale: number; color: string; size?: number }) => {
  let px = x * scale, pz = z * scale;
  const d = Math.hypot(px, pz);
  if (d > R - 4) { const k = (R - 4) / d; px *= k; pz *= k; } // clamp to rim
  return <div className="absolute rounded-full" style={{ left: `calc(50% + ${px}px)`, top: `calc(50% + ${pz}px)`, width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2, background: color, boxShadow: `0 0 6px ${color}` }} />;
};

export const MiniMapHUD = () => {
  usePoll(140);
  const areaId = usePlayerStore.getState().currentAreaId;
  const pos = usePlayerStore.getState().position;
  const area = getWorldArea(areaId);
  const theme = resolveAreaTheme(areaId);
  const edges = area?.edges ?? {};
  const range = Math.max(20, Math.min(120, getEffectiveAreaSize(areaId) + RANGE_PAD));
  const scale = R / range;
  const px = pos?.x ?? 0, pz = pos?.z ?? 0;

  const points = area?.points ?? [];
  const npcs = useEditorNpcStore.getState().addedNpcs.filter((n) => n.areaId === areaId);
  const incidents = useIncidentStore.getState().getActiveForArea(areaId);
  const bcfg = useEditorBoostStore.getState();
  const pickups = computePickupPositions(areaId, bcfg.pickupCount, bcfg.pickupSpread);

  return (
    <div className="pointer-events-none absolute left-1/2 top-3 z-[70] -translate-x-1/2 flex flex-col items-center">
      <div className="mb-1 rounded-full bg-slate-950/70 px-3 py-0.5 text-[11px] font-bold text-cyan-100 shadow backdrop-blur-md">🛰 {area?.name ?? areaId}</div>
      <div className="relative overflow-hidden rounded-full border-2 border-cyan-500/40 shadow-xl" style={{ width: R * 2, height: R * 2, background: `radial-gradient(circle, ${theme.fogColor}55 0%, rgba(2,6,23,0.85) 75%)` }}>
        {/* range rings */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-400/20" style={{ width: R, height: R }} />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-400/15" style={{ width: R * 1.6, height: R * 1.6 }} />
        {/* rotating sweep */}
        <div className="absolute inset-0 animate-spin rounded-full" style={{ animationDuration: '3s', background: 'conic-gradient(from 0deg, rgba(34,211,238,0.30), rgba(34,211,238,0) 70deg)' }} />
        {/* pickups / incidents / npcs */}
        {pickups.map((p, i) => <Dot key={`pk${i}`} x={p[0] - px} z={p[2] - pz} scale={scale} color="#fde047" size={4} />)}
        {points.map((p) => <Dot key={p.id} x={p.position[0] - px} z={p.position[2] - pz} scale={scale} color={p.color || MAP_POINT_COLOR[p.type]} size={7} />)}
        {npcs.map((n) => <Dot key={n.id} x={n.position[0] - px} z={n.position[2] - pz} scale={scale} color="#38bdf8" />)}
        {incidents.map((d) => <Dot key={d.id} x={d.markerPosition[0] - px} z={d.markerPosition[2] - pz} scale={scale} color="#ef4444" size={8} />)}
        {/* edge exits on the rim */}
        {(Object.keys(edges) as EdgeDir[]).filter((e) => edges[e]).map((e) => {
          const a = (EDGE_ANGLE[e] * Math.PI) / 180;
          return <div key={e} className="absolute text-[10px] font-bold text-emerald-300" style={{ left: `calc(50% + ${Math.cos(a) * (R - 8)}px)`, top: `calc(50% + ${Math.sin(a) * (R - 8)}px)`, transform: 'translate(-50%,-50%)' }} title={getKitArea(edges[e]!)?.name ?? ''}>{EDGE_ARROW[e]}</div>;
        })}
        {/* player */}
        <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow ring-2 ring-emerald-300/70" />
      </div>
    </div>
  );
};
