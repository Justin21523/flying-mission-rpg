import { useRef } from 'react';
import { useEditorLocationStore } from '../../stores/game/editorLocationStore';
import type { WorldLocation } from '../../types/game/world';

// Self-made 2D/SVG world map — no external/copyrighted art. A stylised grid backdrop with a clickable pin per
// location (base marked ★). Positions come from each location's editable mapPosition (0..100). Read-only at
// runtime; the 🗺 Map editor passes `editable` + `onMovePin` to drag pins, `regionColorFor` to tint by region,
// `lockedIds` to dim locked locations, and `missionCountFor` to badge mission counts.
export const WorldMapPanel = ({
  activeLocationId,
  onPick,
  selectedId,
  editable = false,
  onMovePin,
  regionColorFor,
  lockedIds,
  missionCountFor,
}: {
  activeLocationId: string | null;
  onPick: (id: string | null) => void;
  selectedId?: string | null;
  editable?: boolean;
  onMovePin?: (id: string, x: number, y: number) => void;
  regionColorFor?: (loc: WorldLocation) => string | undefined;
  lockedIds?: Set<string>;
  missionCountFor?: (id: string) => number;
}) => {
  const locations = useEditorLocationStore((s) => s.items);
  const bases = locations.filter((l) => l.isBase);
  const dests = locations.filter((l) => !l.isBase);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragId = useRef<string | null>(null);

  const clamp = (v: number) => (v < 0 ? 0 : v > 100 ? 100 : v);
  const toSvg = (e: { clientX: number; clientY: number }): { x: number; y: number } | null => {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r || r.width === 0) return null;
    return { x: clamp(((e.clientX - r.left) / r.width) * 100), y: clamp(((e.clientY - r.top) / r.height) * 100) };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!editable || !dragId.current || !onMovePin) return;
    const p = toSvg(e);
    if (p) onMovePin(dragId.current, Math.round(p.x * 10) / 10, Math.round(p.y * 10) / 10);
  };
  const endDrag = () => { dragId.current = null; };

  return (
    <div className="relative h-full min-h-[18rem] w-full overflow-hidden rounded-2xl border border-sky-900/50">
      <svg
        ref={svgRef}
        viewBox="0 0 100 100"
        preserveAspectRatio={editable ? 'none' : 'xMidYMid slice'}
        className="h-full w-full"
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
      >
        <defs>
          <radialGradient id="mapbg" cx="50%" cy="45%" r="70%">
            <stop offset="0%" stopColor="#0b2740" />
            <stop offset="100%" stopColor="#06101f" />
          </radialGradient>
        </defs>
        <rect x="0" y="0" width="100" height="100" fill="url(#mapbg)" />
        {[20, 40, 60, 80].map((g) => (
          <line key={`h${g}`} x1="0" y1={g} x2="100" y2={g} stroke="#15324d" strokeWidth="0.2" />
        ))}
        {[20, 40, 60, 80].map((g) => (
          <line key={`v${g}`} x1={g} y1="0" x2={g} y2="100" stroke="#15324d" strokeWidth="0.2" />
        ))}

        {/* dashed links base → destinations */}
        {bases.map((b) =>
          dests.map((d) => (
            <line key={`${b.id}-${d.id}`} x1={b.mapPosition.x} y1={b.mapPosition.y} x2={d.mapPosition.x} y2={d.mapPosition.y} stroke="#1f4d6b" strokeWidth="0.3" strokeDasharray="1 1" />
          )),
        )}

        {locations.map((l) => {
          const active = l.id === activeLocationId || l.id === selectedId;
          const locked = lockedIds?.has(l.id) ?? false;
          const fill = regionColorFor?.(l) ?? (l.isBase ? '#f59e0b' : '#38bdf8');
          const count = missionCountFor?.(l.id) ?? 0;
          return (
            <g
              key={l.id}
              onPointerDown={(e) => {
                if (locked && !editable) return;
                if (editable && onMovePin) { dragId.current = l.id; (e.target as Element).setPointerCapture?.(e.pointerId); }
                onPick(active ? null : l.id);
              }}
              style={{ cursor: editable ? 'grab' : locked ? 'not-allowed' : 'pointer', opacity: locked ? 0.4 : 1 }}
            >
              {active && <circle cx={l.mapPosition.x} cy={l.mapPosition.y} r="3.8" fill="none" stroke="#7dd3fc" strokeWidth="0.4" />}
              <circle cx={l.mapPosition.x} cy={l.mapPosition.y} r={active ? 2.6 : 1.8} fill={fill} stroke="#0b1220" strokeWidth="0.3" />
              <text x={l.mapPosition.x} y={l.mapPosition.y - 3} textAnchor="middle" fontSize="3" fill="#cbd5e1">
                {l.isBase ? '★ ' : ''}{l.name}{locked ? ' 🔒' : ''}
              </text>
              {count > 0 && <text x={l.mapPosition.x} y={l.mapPosition.y + 4.5} textAnchor="middle" fontSize="2.4" fill="#86efac">{count} mission{count > 1 ? 's' : ''}</text>}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
