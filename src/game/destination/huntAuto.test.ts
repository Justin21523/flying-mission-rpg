import { describe, it, expect } from 'vitest';
import { autoHuntRoll } from './huntAuto';

const cfg = (autoEnabled: boolean, autoIntervalSec = 10, autoChance = 1) => ({ autoEnabled, autoIntervalSec, autoChance });

describe('autoHuntRoll', () => {
  it('disabled → never starts, timer stays 0', () => {
    expect(autoHuntRoll(cfg(false), 5, 1, () => 0)).toEqual({ timer: 0, start: false });
  });
  it('accumulates until the interval, then rolls', () => {
    expect(autoHuntRoll(cfg(true, 10), 4, 1, () => 0)).toEqual({ timer: 5, start: false });
    expect(autoHuntRoll(cfg(true, 10, 1), 9.5, 1, () => 0.4)).toEqual({ timer: 0, start: true }); // 0.4 < 1
  });
  it('respects chance on the roll', () => {
    expect(autoHuntRoll(cfg(true, 10, 0.3), 10, 1, () => 0.5).start).toBe(false); // 0.5 !< 0.3
    expect(autoHuntRoll(cfg(true, 10, 0.3), 10, 1, () => 0.2).start).toBe(true);
  });
});
