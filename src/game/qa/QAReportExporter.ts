import type { ReleaseCandidateReport } from './ReleaseCandidateChecklist';

export function exportQAReport(report: ReleaseCandidateReport): string {
  return JSON.stringify(report, null, 2);
}

export function summarizeQAReport(report: ReleaseCandidateReport): string {
  return [
    `RC Status: ${report.status.toUpperCase()}`,
    `Generated: ${report.generatedAt}`,
    `P0 blockers: ${report.p0Blockers.length}`,
    `P1 warnings: ${report.p1Warnings.length}`,
    `P2 info: ${report.p2Info.length}`,
  ].join('\n');
}
