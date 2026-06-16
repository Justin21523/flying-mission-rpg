import { useIncidentRuntimeStore } from '../../stores/useIncidentRuntimeStore';

// Suggested solutions + recommended characters (Batch G §12). Every incident lists ≥2 so no single character
// is mandatory.
const CHAR_SHORT = (id: string) => id.replace('char_', '');
export const IncidentSolutionHintPanel = () => {
  const plan = useIncidentRuntimeStore((s) => s.plan);
  if (!plan) return null;
  return (
    <div className="mt-1">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-sky-300">Solutions</div>
      <div className="mt-0.5 space-y-0.5">
        {plan.availableSolutions.slice(0, 4).map((sol) => (
          <div key={sol.id} className="text-[10px] text-slate-300" title={sol.description}>• {sol.label}</div>
        ))}
      </div>
      <div className="mt-0.5 text-[9px] text-slate-400">Recommended: {plan.recommendedCharacterIds.map(CHAR_SHORT).join(', ') || '—'}</div>
    </div>
  );
};
