import { useIncidentRuntimeStore } from '../../stores/useIncidentRuntimeStore';

// Danger level meter (Batch G §12) — 1..5 dots + escalation warning.
export const IncidentDangerMeter = () => {
  const danger = useIncidentRuntimeStore((s) => s.runtime.dangerLevel);
  const esc = useIncidentRuntimeStore((s) => s.runtime.currentEscalationLevel);
  return (
    <div className="mt-1 flex items-center gap-1 text-[10px]">
      <span className="text-slate-400">Danger</span>
      {[1, 2, 3, 4, 5].map((i) => <span key={i} className={i <= danger ? 'text-rose-400' : 'text-slate-700'}>●</span>)}
      {esc > 0 && <span className="ml-1 rounded bg-rose-900/70 px-1 text-[8px] text-rose-200">⚠ escalating ×{esc}</span>}
    </div>
  );
};
