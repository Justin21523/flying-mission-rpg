import { useIncidentRuntimeStore } from '../../stores/useIncidentRuntimeStore';

// Incident success / failure toast (Batch G §12).
export const IncidentResultToast = () => {
  const status = useIncidentRuntimeStore((s) => s.runtime.status);
  const plan = useIncidentRuntimeStore((s) => s.plan);
  if (!plan || (status !== 'success' && status !== 'completed' && status !== 'failed')) return null;
  const failed = status === 'failed';
  return (
    <div className="pointer-events-none fixed left-1/2 top-24 z-40 -translate-x-1/2">
      <div className={`rounded-xl border px-4 py-2 text-center shadow-lg backdrop-blur ${failed ? 'border-rose-500/40 bg-rose-950/80 text-rose-200' : 'border-emerald-500/40 bg-emerald-950/80 text-emerald-200'}`}>
        <div className="text-sm font-bold">{failed ? '✗ Incident Failed' : '✓ Incident Resolved'}</div>
        <div className="text-[10px] opacity-80">{plan.title}</div>
      </div>
    </div>
  );
};
