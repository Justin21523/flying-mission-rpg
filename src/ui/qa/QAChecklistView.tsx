import type { QACheck } from '../../game/qa/ReleaseCandidateChecklist';
import { QAStatusBadge } from './QAStatusBadge';

export const QAChecklistView = ({ checks }: { checks: QACheck[] }) => (
  <div className="max-h-72 overflow-auto space-y-1">
    {checks.map((check) => (
      <div key={check.id} className="rounded border border-slate-800 bg-slate-900/60 p-2">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[11px] font-bold text-slate-200">{check.label}</span>
          <QAStatusBadge status={check.status} />
        </div>
        {check.findings[0] && <div className="mt-1 text-[10px] text-slate-400">{check.findings[0].message}</div>}
      </div>
    ))}
  </div>
);
