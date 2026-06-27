import { describe, expect, it } from 'vitest';
import { seededHash } from './seededHash';

// The legacy inline formula each renderer used before seeding was threaded in.
const legacy = (n: number, k: number, c: number) => { const x = Math.sin(n * k + c) * 43758.5453; return x - Math.floor(x); };

describe('seededHash', () => {
  it('is deterministic — same inputs give the same output', () => {
    expect(seededHash(7, 3, 127.1, 311.7)).toBe(seededHash(7, 3, 127.1, 311.7));
  });

  it('stays within [0, 1)', () => {
    for (let i = 0; i < 50; i++) { const v = seededHash(i, i % 4, 53.7, 19.1); expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThan(1); }
  });

  it('at seed 0 reproduces the renderers\' original inline formula exactly (no cosmetic change)', () => {
    for (let i = 0; i < 20; i++) {
      expect(seededHash(i, 0, 127.1, 311.7)).toBe(legacy(i, 127.1, 311.7)); // ParticleRenderer constants
      expect(seededHash(i, 0, 53.7, 19.1)).toBe(legacy(i, 53.7, 19.1)); // ModelParticleRenderer constants
    }
  });

  it('a different seed changes the scatter (re-roll works)', () => {
    let differ = 0;
    for (let i = 0; i < 20; i++) if (seededHash(i, 0) !== seededHash(i, 1)) differ++;
    expect(differ).toBeGreaterThan(15); // virtually all particles move
  });
});
