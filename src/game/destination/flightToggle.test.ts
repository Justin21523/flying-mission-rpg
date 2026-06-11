import { describe, it, expect } from 'vitest';
import { nextFlying } from './flightToggle';

describe('nextFlying', () => {
  it('toggles when the character can fly', () => {
    expect(nextFlying(true, false)).toBe(true);
    expect(nextFlying(true, true)).toBe(false);
  });
  it('stays grounded when the character cannot fly', () => {
    expect(nextFlying(false, false)).toBe(false);
    expect(nextFlying(false, true)).toBe(false);
    expect(nextFlying(undefined, true)).toBe(false);
  });
});
