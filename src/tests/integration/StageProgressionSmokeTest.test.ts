import { beforeEach, describe, expect, it } from 'vitest';
import { seedGameContent } from '../../game/boot/seedGameContent';
import { runStageProgressionSmokeTest } from '../../game/qa/StageProgressionSmokeTest';

describe('StageProgressionSmokeTest', () => {
  beforeEach(() => { localStorage.clear(); seedGameContent(); });

  it('validates all campaign stage references', () => {
    const checks = runStageProgressionSmokeTest();
    expect(checks.filter((check) => check.status === 'fail')).toEqual([]);
  });
});
