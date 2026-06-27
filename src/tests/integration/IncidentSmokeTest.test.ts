import { beforeEach, describe, expect, it } from 'vitest';
import { seedGameContent } from '../../game/boot/seedGameContent';
import { runIncidentSmokeTest } from '../../game/qa/IncidentSmokeTest';

describe('IncidentSmokeTest', () => {
  beforeEach(() => { localStorage.clear(); seedGameContent(); });

  it('confirms incident templates are ready for mock runtime', () => {
    expect(runIncidentSmokeTest().filter((check) => check.status === 'fail')).toEqual([]);
  });
});
