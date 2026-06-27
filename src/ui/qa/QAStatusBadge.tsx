import type { QAStatus } from '../../game/qa/ReleaseCandidateChecklist';

export const QAStatusBadge = ({ status }: { status: QAStatus }) => {
  const cls = status === 'pass' ? 'border-emerald-500/50 bg-emerald-950/50 text-emerald-200' : status === 'warning' ? 'border-amber-500/50 bg-amber-950/50 text-amber-200' : 'border-rose-500/50 bg-rose-950/50 text-rose-200';
  return <span className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${cls}`}>{status}</span>;
};
