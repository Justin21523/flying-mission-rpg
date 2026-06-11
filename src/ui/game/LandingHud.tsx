import { useDestinationRuntimeStore } from '../../stores/game/destinationRuntimeStore';

// LANDING — the landing-quality banner while the robot settles.
const QUALITY_STYLE: Record<string, string> = {
  perfect: 'border-emerald-500/60 text-emerald-200',
  good: 'border-sky-500/60 text-sky-200',
  rough: 'border-amber-500/60 text-amber-200',
  unsafe: 'border-rose-500/60 text-rose-200',
};

export const LandingHud = () => {
  const evaluation = useDestinationRuntimeStore((s) => s.evaluation);
  if (!evaluation) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-24 z-[60] flex flex-col items-center gap-1">
      <div className={`rounded-2xl border bg-slate-950/85 px-6 py-3 text-center backdrop-blur ${QUALITY_STYLE[evaluation.quality]}`}>
        <div className="text-lg font-bold uppercase">{evaluation.quality} landing!</div>
        <div className="text-[11px] text-slate-400">
          ↓ {evaluation.verticalSpeed.toFixed(1)} · ↔ {evaluation.horizontalSpeed.toFixed(1)}{evaluation.zoneId ? ` · ${evaluation.zoneId}` : ''}
        </div>
      </div>
    </div>
  );
};
