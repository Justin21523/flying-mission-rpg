import { missionDoneFlag } from './missionChain';

// Completed missions are recorded as `mission:<id>:done` world flags (set on completion, persisted by the
// flag store). These pure helpers read that record back. The `mission:` prefix + `:done` suffix is the single
// source of truth (see missionChain.missionDoneFlag).
const DONE_RE = /^mission:(.+):done$/;

export function isMissionComplete(flags: Record<string, boolean>, missionId: string): boolean {
  return flags[missionDoneFlag(missionId)] === true;
}

// All completed mission ids present in the flag set (order not guaranteed).
export function completedMissionIds(flags: Record<string, boolean>): string[] {
  const out: string[] = [];
  for (const [key, on] of Object.entries(flags)) {
    if (!on) continue;
    const m = DONE_RE.exec(key);
    if (m) out.push(m[1]);
  }
  return out;
}
