import { describe, it, expect } from 'vitest';
import { defaultSupers } from './defaultSupers';
import { superForKey } from './superForKey';

describe('defaultSupers', () => {
  const set = defaultSupers('#abcdef');

  it('provides exactly six moves, one per slot 1-6', () => {
    expect(set).toHaveLength(6);
    for (let i = 1; i <= 6; i += 1) {
      const move = superForKey(set, `Digit${i}`);
      expect(move).not.toBeNull();
      expect(move?.damage).toBeGreaterThan(0);
      expect(move?.cooldownSec).toBeGreaterThan(0);
    }
  });

  it('tints every move with the character colour', () => {
    expect(set.every((m) => m.color === '#abcdef')).toBe(true);
  });

  it('has unique ids and varied kinds', () => {
    expect(new Set(set.map((m) => m.id)).size).toBe(6);
    expect(new Set(set.map((m) => m.kind)).size).toBeGreaterThan(1);
  });
});
