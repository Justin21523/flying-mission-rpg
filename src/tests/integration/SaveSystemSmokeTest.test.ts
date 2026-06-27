import { beforeEach, describe, expect, it } from 'vitest';
import { seedGameContent } from '../../game/boot/seedGameContent';
import { runSaveSystemSmokeTest } from '../../game/qa/SaveSystemSmokeTest';

describe('SaveSystemSmokeTest', () => {
  beforeEach(() => { localStorage.clear(); seedGameContent(); });

  it('persists settings/progression and resets demo progress', () => {
    expect(runSaveSystemSmokeTest().filter((check) => check.status === 'fail')).toEqual([]);
  });
});
