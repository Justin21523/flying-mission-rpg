import { describe, it, expect } from 'vitest';
import { enrageState, introActive } from './bossEncounterState';

describe('enrageState', () => {
  it('no config → never enraged, mult 1', () => {
    expect(enrageState(999, undefined)).toEqual({ enraged: false, damageMult: 1, remaining: Infinity });
  });
  it('before threshold: not enraged, mult 1, counts down', () => {
    const s = enrageState(30, { afterSeconds: 90, damageMultiplier: 1.6 });
    expect(s.enraged).toBe(false);
    expect(s.damageMult).toBe(1);
    expect(s.remaining).toBe(60);
  });
  it('at/after threshold: enraged, applies multiplier', () => {
    const s = enrageState(90, { afterSeconds: 90, damageMultiplier: 1.6 });
    expect(s.enraged).toBe(true);
    expect(s.damageMult).toBe(1.6);
    expect(s.remaining).toBe(0);
  });
});

describe('introActive', () => {
  it('true while now is before introUntil', () => {
    expect(introActive(2, 5)).toBe(true);
    expect(introActive(5, 5)).toBe(false);
    expect(introActive(6, 5)).toBe(false);
  });
});
