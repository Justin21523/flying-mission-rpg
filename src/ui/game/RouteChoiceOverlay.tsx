import { useGameStore } from '../../stores/game/useGameStore';
import { useAdvancedMissionZoneStore } from '../../stores/game/useAdvancedMissionZoneStore';
import { useEditorZoneSegmentStore } from '../../stores/game/editorZoneSegmentStore';
import { chooseSegmentRoute } from '../../game/advanced-mission-zone/AdvancedMissionZoneDirector';
import { panel } from './screenChrome';

// Wave 3 — route choice. When a completed segment offers more than one next path, the zone director pauses in
// ZONE_COMPLETE and this overlay lets the player pick (combat / puzzle / high-risk treasure). Data-driven: any
// segment with nextSegmentIds.length > 1 triggers it. Picking calls chooseSegmentRoute → advances the zone.
const TREASURE_TYPES = new Set(['supply', 'boss']);

export const RouteChoiceOverlay = () => {
  const phase = useGameStore((s) => s.phase);
  const pending = useAdvancedMissionZoneStore((s) => s.pendingNextSegmentIds);
  const segs = useEditorZoneSegmentStore((s) => s.items);
  if (phase !== 'ZONE_COMPLETE' || pending.length < 2) return null;

  const options = pending.map((id) => segs.find((s) => s.id === id)).filter((s): s is NonNullable<typeof s> => !!s);
  if (options.length < 2) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
      <div className={`${panel} w-[42rem] max-w-[92vw] p-5`}>
        <div className="text-center text-xs font-black uppercase tracking-widest text-amber-300">Choose your path</div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {options.map((seg) => {
            const risky = TREASURE_TYPES.has(seg.segmentType);
            return (
              <button
                key={seg.id}
                onClick={() => chooseSegmentRoute(seg.id)}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition ${risky ? 'border-rose-700 bg-rose-950/40 hover:border-rose-400 hover:bg-rose-500/10' : 'border-slate-700 bg-slate-900/70 hover:border-amber-400 hover:bg-amber-500/5'}`}
              >
                <span className="text-3xl">{risky ? '💎' : seg.segmentType === 'repair' ? '🔧' : '⚔'}</span>
                <span className="text-sm font-black text-slate-100">{seg.name}</span>
                <span className="text-[10px] uppercase tracking-wider text-slate-500">{seg.segmentType}{risky ? ' · high risk' : ''}</span>
                {seg.description && <span className="text-[11px] text-slate-400">{seg.description}</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
