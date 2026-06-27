import { beforeEach, describe, expect, it } from 'vitest';
import { seedGameContent } from '../../game/boot/seedGameContent';
import { runRecordingReadinessSmokeTest } from '../../game/qa/RecordingReadinessSmokeTest';

describe('RecordingReadinessSmokeTest', () => {
  beforeEach(() => { localStorage.clear(); seedGameContent(); });

  it('passes recording readiness checks', () => {
    expect(runRecordingReadinessSmokeTest().filter((check) => check.status === 'fail')).toEqual([]);
  });
});
