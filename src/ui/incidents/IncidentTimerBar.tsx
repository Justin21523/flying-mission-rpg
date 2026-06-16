import { useIncidentRuntimeStore } from '../../stores/useIncidentRuntimeStore';

// Incident time-limit bar (Batch G §12).
export const IncidentTimerBar = () => {
  const plan = useIncidentRuntimeStore((s) => s.plan);
  const remaining = useIncidentRuntimeStore((s) => s.runtime.timeRemainingSeconds);
  if (!plan?.timeLimitSeconds || remaining == null) return null;
  const frac = Math.max(0, Math.min(1, remaining / plan.timeLimitSeconds));
  const low = frac < 0.25;
  return (
    <div className="mt-1">
      <div className="flex justify-between text-[9px] text-slate-400"><span>Time</span><span className={low ? 'text-rose-300' : ''}>{Math.ceil(remaining)}s</span></div>
      <div className="h-1.5 w-full overflow-hidden rounded bg-slate-800">
        <div className={`h-full ${low ? 'bg-rose-500' : 'bg-sky-500'}`} style={{ width: `${frac * 100}%` }} />
      </div>
    </div>
  );
};
