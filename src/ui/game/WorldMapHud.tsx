import { usePoll } from '../usePoll';
import { flightHandle } from '../../game/flight/flightHandle';
import { getActiveRoute } from '../../game/flight/world/worldRoute';
import { getEditorLocation } from '../../stores/game/editorLocationStore';
import { useEditorLocationStore } from '../../stores/game/editorLocationStore';

// World-map HUD (bottom-right) — a stylised SVG of all locations (editable mapPosition pins) with the
// active route drawn from origin → destination and a craft marker interpolated along it by route
// progress (flightHandle.routeU). Self-made art (no copyrighted maps); moves live as the craft advances.
export const WorldMapHud = () => {
  usePoll(150);
  const locations = useEditorLocationStore((s) => s.items);
  const route = getActiveRoute();
  if (!route) return null;
  const from = getEditorLocation(route.fromLocationId);
  const to = getEditorLocation(route.toLocationId);
  const u = flightHandle.routeU;
  const cx = from && to ? from.mapPosition.x + (to.mapPosition.x - from.mapPosition.x) * u : 50;
  const cy = from && to ? from.mapPosition.y + (to.mapPosition.y - from.mapPosition.y) * u : 50;

  return (
    <div className="pointer-events-none fixed bottom-3 right-3 z-[60] w-44 overflow-hidden rounded-xl border border-sky-900/50 bg-slate-950/70 backdrop-blur">
      <div className="px-2 py-1 text-[10px] font-bold text-sky-200">🗺 WORLD MAP</div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="h-32 w-full">
        <defs>
          <radialGradient id="whbg" cx="50%" cy="45%" r="70%">
            <stop offset="0%" stopColor="#0b2740" />
            <stop offset="100%" stopColor="#06101f" />
          </radialGradient>
        </defs>
        <rect x="0" y="0" width="100" height="100" fill="url(#whbg)" />
        {[25, 50, 75].map((g) => (
          <line key={`h${g}`} x1="0" y1={g} x2="100" y2={g} stroke="#15324d" strokeWidth="0.2" />
        ))}
        {[25, 50, 75].map((g) => (
          <line key={`v${g}`} x1={g} y1="0" x2={g} y2="100" stroke="#15324d" strokeWidth="0.2" />
        ))}

        {/* active route line */}
        {from && to && (
          <line x1={from.mapPosition.x} y1={from.mapPosition.y} x2={to.mapPosition.x} y2={to.mapPosition.y} stroke="#38bdf8" strokeWidth="0.5" strokeDasharray="2 1.5" />
        )}

        {/* location pins */}
        {locations.map((l) => (
          <g key={l.id}>
            <circle cx={l.mapPosition.x} cy={l.mapPosition.y} r={l.isBase ? 2.2 : 1.6} fill={l.isBase ? '#f59e0b' : '#38bdf8'} stroke="#0b1220" strokeWidth="0.3" />
            <text x={l.mapPosition.x} y={l.mapPosition.y - 2.6} textAnchor="middle" fontSize="2.6" fill="#cbd5e1">
              {l.isBase ? '★ ' : ''}
              {l.name}
            </text>
          </g>
        ))}

        {/* craft marker (interpolated by progress) */}
        <circle cx={cx} cy={cy} r="2.6" fill="none" stroke="#fef08a" strokeWidth="0.5" />
        <circle cx={cx} cy={cy} r="1.3" fill="#fef08a" />
      </svg>
    </div>
  );
};
