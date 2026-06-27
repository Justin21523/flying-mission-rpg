import { beforeEach, describe, expect, it } from 'vitest';
import { seedGameContent } from '../../game/boot/seedGameContent';
import { runUiAccessibilityAudit } from '../../game/qa/UiAccessibilityAudit';

describe('UiAccessibilityAudit', () => {
  beforeEach(() => { localStorage.clear(); seedGameContent(); });

  it('passes core demo UI and accessibility checks', () => {
    expect(runUiAccessibilityAudit().filter((check) => check.status === 'fail')).toEqual([]);
  });
});
