import type { QACheck, QAFinding } from './ReleaseCandidateChecklist';
import { makeQACheck } from './ReleaseCandidateChecklist';

export function makeSmokeCheck(id: string, label: string, system: string, pass: boolean, message: string): QACheck {
  const finding: QAFinding | undefined = pass ? undefined : { id: `${id}_failed`, severity: 'error', system, message };
  return makeQACheck(id, label, system, pass, finding);
}

export function hasNoErrors(findings: QAFinding[]): boolean {
  return !findings.some((finding) => finding.severity === 'error');
}
