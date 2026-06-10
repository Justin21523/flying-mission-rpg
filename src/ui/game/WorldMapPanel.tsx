import { useEditorLocationStore } from '../../stores/game/editorLocationStore';

// Self-made 2D/SVG world map — no external/copyrighted art. A stylised grid backdrop with a clickable
// pin per location (base marked ★). Positions come from each location's editable mapPosition (0..100),
// so editing a location in the 🌍 tab moves its pin live.
export const WorldMapPanel = ({
  activeLocationId,
  onPick,
}: {
  activeLocationId: string | null;
  onPick: (id: string | null) => void;
}) => {
  const locations = useEditorLocationStore((s) => s.items);
  const bases = locations.filter((l) => l.isBase);
  const dests = locations.filter((l) => !l.isBase);

  return (
    <div className="relative h-full min-h-[18rem] w-full overflow-hidden rounded-2xl border border-sky-900/50">
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
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
            <line
              key={`${b.id}-${d.id}`}
              x1={b.mapPosition.x}
              y1={b.mapPosition.y}
              x2={d.mapPosition.x}
              y2={d.mapPosition.y}
              stroke="#1f4d6b"
              strokeWidth="0.3"
              strokeDasharray="1 1"
            />
          )),
        )}

        {locations.map((l) => {
          const active = l.id === activeLocationId;
          return (
            <g key={l.id} onClick={() => onPick(active ? null : l.id)} style={{ cursor: 'pointer' }}>
              {active && <circle cx={l.mapPosition.x} cy={l.mapPosition.y} r="3.8" fill="none" stroke="#7dd3fc" strokeWidth="0.4" />}
              <circle
                cx={l.mapPosition.x}
                cy={l.mapPosition.y}
                r={active ? 2.6 : 1.8}
                fill={l.isBase ? '#f59e0b' : '#38bdf8'}
                stroke="#0b1220"
                strokeWidth="0.3"
              />
              <text x={l.mapPosition.x} y={l.mapPosition.y - 3} textAnchor="middle" fontSize="3" fill="#cbd5e1">
                {l.isBase ? '★ ' : ''}
                {l.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
