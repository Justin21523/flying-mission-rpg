import type { ReleaseCandidateReport } from '../../game/qa/ReleaseCandidateChecklist';
import { exportQAReport } from '../../game/qa/QAReportExporter';

export const QAReportExportButton = ({ report }: { report: ReleaseCandidateReport | null }) => (
  <button
    className="rounded bg-slate-800 px-2 py-1 text-[11px] font-bold text-slate-100 hover:bg-slate-700"
    onClick={() => {
      if (!report) return;
      console.info('[release-candidate-report]', exportQAReport(report));
    }}
  >
    Export QA JSON
  </button>
);
