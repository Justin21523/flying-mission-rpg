import { beforeEach, describe, expect, it } from 'vitest';
import { seedGameContent } from '../../game/boot/seedGameContent';
import { clearRuntimeErrors } from '../../game/qa/RuntimeErrorCollector';
import { runAllChecks } from '../../game/qa/ReleaseCandidateRunner';

describe('ReleaseCandidateRunner', () => {
  beforeEach(() => { localStorage.clear(); clearRuntimeErrors(); seedGameContent(); });

  it('reports no P0 blocker for the deterministic release candidate smoke pass', () => {
    const report = runAllChecks();
    expect(report.p0Blockers).toEqual([]);
    expect(report.checklist.build.typecheckPass).toBe(true);
    expect(report.checklist.campaign.stageClearUnlocksNext).toBe(true);
  });
});
