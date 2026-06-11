import { describe, it, expect } from 'vitest';
import { mulberry32, hashSeed } from './rng';

describe('mulberry32', () => {
  it('is deterministic for the same seed', () => {
    const a = mulberry32('seed-1');
    const b = mulberry32('seed-1');
    const seqA = Array.from({ length: 10 }, () => a.next());
    const seqB = Array.from({ length: 10 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it('differs across seeds', () => {
    const a = Array.from({ length: 5 }, mulberry32('seed-1').next);
    const b = Array.from({ length: 5 }, mulberry32('seed-2').next);
    expect(a).not.toEqual(b);
  });

  it('next() stays in [0,1)', () => {
    const r = mulberry32(42);
    for (let i = 0; i < 1000; i += 1) {
      const v = r.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('int/range/pick stay in bounds', () => {
    const r = mulberry32('bounds');
    for (let i = 0; i < 200; i += 1) {
      expect(r.int(5)).toBeGreaterThanOrEqual(0);
      expect(r.int(5)).toBeLessThan(5);
      const v = r.range(3, 7);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(7);
      expect([10, 20, 30]).toContain(r.pick([10, 20, 30]));
    }
  });

  it('weighted respects zero weights', () => {
    const r = mulberry32('w');
    for (let i = 0; i < 100; i += 1) {
      expect(r.weighted(['a', 'b', 'c'], [0, 1, 0])).toBe('b');
    }
  });

  it('shuffle keeps the same elements and is deterministic', () => {
    const src = [1, 2, 3, 4, 5];
    expect(mulberry32('s').shuffle(src).sort()).toEqual(src);
    expect(mulberry32('s').shuffle(src)).toEqual(mulberry32('s').shuffle(src));
  });

  it('hashSeed passes numbers through as uint32', () => {
    expect(hashSeed(7)).toBe(7);
    expect(hashSeed('x')).toBe(hashSeed('x'));
  });
});
