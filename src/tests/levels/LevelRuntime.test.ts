import { describe, expect, it, beforeEach } from 'vitest';
import { seedGameContent } from '../../game/boot/seedGameContent';
import { loadLevelLayout } from '../../game/levels/LevelRuntime';

describe('LevelRuntime', () => {
  beforeEach(() => { localStorage.clear(); seedGameContent(); });
  it('loads a level layout', () => expect(loadLevelLayout('layout_sunny_harbor_emergency').startSegmentId).toBe('seg_landing_dock'));
});
