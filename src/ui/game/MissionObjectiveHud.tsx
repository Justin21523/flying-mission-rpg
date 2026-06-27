import { useGameStore } from '../../stores/game/useGameStore';
import { useAdvancedMissionZoneStore } from '../../stores/game/useAdvancedMissionZoneStore';
import { useEditorZoneSegmentStore } from '../../stores/game/editorZoneSegmentStore';

// Batch O — live progress bars for the active segment's mission-type objectives (defense-waves / timed-rescue /
// scan-targets). Reads the host-written progress from the zone store. Sits below the objective toast.
const MISSION_TYPES = new Set(['defense-waves', 'timed-rescue', 'scan-targets', 'escort-npc', 'hold-zone', 'survive-timer', 'hack-terminals']);

export const MissionObjectiveHud = () => {
  const phase = useGameStore((s) => s.phase);
  const segId = useAdvancedMissionZoneStore((s) => s.activeSegmentId);
  const progress = useAdvancedMissionZoneStore((s) => s.missionObjectiveProgress);
  const completed = useAdvancedMissionZoneStore((s) => s.completedMissionObjectiveIds);
  const segments = useEditorZoneSegmentStore((s) => s.items);

  if (phase !== 'ZONE_SEGMENT_GAMEPLAY' || !segId) return null;
  const seg = segments.find((s) => s.id === segId);
  const conds = seg?.completionConditions.filter((c) => MISSION_TYPES.has(c.type)) ?? [];
  if (conds.length === 0) return null;

  return (
    <div className="pointer-events-none fixed left-1/2 top-16 z-30 w-80 -translate-x-1/2 space-y-1.5">
      {conds.map((c) => {
        const p = progress[c.id] ?? { current: 0, total: 1 };
        const done = completed.includes(c.id);
        const frac = Math.max(0, Math.min(1, p.current / Math.max(1, p.total)));
        return (
          <div key={c.id} className="rounded-lg border border-slate-700/70 bg-slate-900/80 px-3 py-1.5 shadow backdrop-blur">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold uppercase tracking-wide text-sky-300">{c.type.replace(/-/g, ' ')}</span>
              <span className={done ? 'text-emerald-300' : 'text-slate-300'}>{done ? '☑ done' : (p.label ?? `${p.current}/${p.total}`)}</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div className={`h-full rounded-full ${done ? 'bg-emerald-500' : 'bg-sky-500'}`} style={{ width: `${(done ? 1 : frac) * 100}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};
