import { useIncidentRuntimeStore } from '../../stores/useIncidentRuntimeStore';

// Incident objective checklist (Batch G §12). Shows each objective step + completed state.
export const IncidentObjectivePanel = () => {
  const plan = useIncidentRuntimeStore((s) => s.plan);
  const done = useIncidentRuntimeStore((s) => s.runtime.completedObjectiveStepIds);
  if (!plan) return null;
  const doneSet = new Set(done);
  return (
    <div className="mt-1">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-amber-300">Objectives</div>
      <div className="mt-0.5 space-y-0.5">
        {plan.objectiveSteps.map((o) => {
          const ok = doneSet.has(o.id);
          return (
            <div key={o.id} className={`flex items-center gap-1 text-[10px] ${ok ? 'text-emerald-300' : 'text-slate-200'}`}>
              <span>{ok ? '✓' : o.optional ? '○' : '◻'}</span>
              <span className={ok ? 'line-through opacity-70' : ''}>{o.label}</span>
              {o.optional && <span className="text-[8px] text-slate-500">(optional)</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
};
