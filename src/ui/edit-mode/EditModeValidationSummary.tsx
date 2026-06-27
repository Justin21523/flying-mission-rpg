import { buildEditModeValidationSummary } from '../../game/demo/EditModeValidationSummaryModel';

export const EditModeValidationSummary = () => {
  const entries = buildEditModeValidationSummary();
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950/45 p-3">
      <div className="text-sm font-bold text-slate-100">Validation Summary</div>
      <div className="mt-2 space-y-1">
        {entries.map((entry) => (
          <div key={entry.label} className="flex items-center justify-between gap-3 rounded bg-slate-900/60 px-2 py-1 text-xs">
            <span className="font-bold text-slate-200">{entry.label}</span>
            <span className={entry.status === 'pass' ? 'text-emerald-300' : entry.status === 'warning' ? 'text-amber-300' : 'text-rose-300'}>{entry.status}</span>
            <span className="ml-auto text-slate-400">{entry.detail}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
