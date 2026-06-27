import { useMemo, useState } from 'react';
import type { ReleaseCandidateReport } from '../../game/qa/ReleaseCandidateChecklist';
import { runAllChecks } from '../../game/qa/ReleaseCandidateRunner';
import { QAStatusBadge } from './QAStatusBadge';
import { QAChecklistView } from './QAChecklistView';
import { QAReportExportButton } from './QAReportExportButton';

export const ReleaseCandidatePanel = () => {
  const [report, setReport] = useState<ReleaseCandidateReport | null>(null);
  const counts = useMemo(() => ({
    p0: report?.p0Blockers.length ?? 0,
    p1: report?.p1Warnings.length ?? 0,
    p2: report?.p2Info.length ?? 0,
  }), [report]);
  return (
    <div className="pointer-events-auto fixed right-3 bottom-3 z-[75] w-[28rem] rounded-xl border border-slate-700 bg-slate-950/92 p-3 text-xs text-slate-200 shadow-2xl backdrop-blur">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <b className="text-sky-200">Release Candidate</b>
          {report && <QAStatusBadge status={report.status} />}
        </div>
        <div className="flex gap-1">
          <button className="rounded bg-sky-700 px-2 py-1 text-[11px] font-bold text-white hover:bg-sky-600" onClick={() => setReport(runAllChecks())}>Run Checks</button>
          <QAReportExportButton report={report} />
        </div>
      </div>
      <div className="mb-2 grid grid-cols-3 gap-1 text-center text-[11px]">
        <div className="rounded bg-rose-950/30 p-1 text-rose-100">P0 {counts.p0}</div>
        <div className="rounded bg-amber-950/30 p-1 text-amber-100">P1 {counts.p1}</div>
        <div className="rounded bg-slate-900 p-1 text-slate-300">P2 {counts.p2}</div>
      </div>
      {report ? <QAChecklistView checks={report.checks} /> : <div className="rounded bg-slate-900/70 p-3 text-slate-400">Run checks to generate the release candidate report.</div>}
    </div>
  );
};
