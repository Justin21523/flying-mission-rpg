import { beforeEach, describe, expect, it } from 'vitest';
import { seedGameContent } from '../../game/boot/seedGameContent';
import { runEditModeSmokeTest } from '../../game/qa/EditModeSmokeTest';

describe('EditModeSmokeTest', () => {
  beforeEach(() => { localStorage.clear(); seedGameContent(); });

  it('opens and exits Edit Mode without state corruption', () => {
    expect(runEditModeSmokeTest().filter((check) => check.status === 'fail')).toEqual([]);
  });
});
