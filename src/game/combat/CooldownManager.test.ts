import { describe, it, expect } from 'vitest';
import { isReady, remainingSeconds, cooldownEndMs, cooldownFraction } from './CooldownManager';

describe('CooldownManager', () => {
  it('is ready when no cooldown recorded', () => {
    expect(isReady({}, 'skill', 1000)).toBe(true);
  });

  it('is not ready while cooling down, ready after it ends', () => {
    const cd = { skill: 5000 };
    expect(isReady(cd, 'skill', 4000)).toBe(false);
    expect(isReady(cd, 'skill', 5000)).toBe(true);
    expect(isReady(cd, 'skill', 6000)).toBe(true);
  });

  it('ignoreCooldown bypasses', () => {
    expect(isReady({ skill: 9999 }, 'skill', 0, true)).toBe(true);
  });

  it('cooldownEndMs respects ignore flag', () => {
    expect(cooldownEndMs(1000, 2)).toBe(3000);
    expect(cooldownEndMs(1000, 2, true)).toBe(0);
  });

  it('remaining + fraction track the window', () => {
    const cd = { skill: 4000 };
    expect(remainingSeconds(cd, 'skill', 2000)).toBe(2);
    expect(cooldownFraction(cd, 'skill', 2000, 4)).toBeCloseTo(0.5, 5);
    expect(cooldownFraction(cd, 'skill', 4000, 4)).toBe(0);
  });
});
