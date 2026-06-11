import { describe, it, expect } from 'vitest';
import { comboMultiplier, nextCombo, rewardFor } from './flightRewards';

describe('comboMultiplier', () => {
  it('grows +0.5 per link, capped at 5', () => {
    expect(comboMultiplier(1)).toBe(1);
    expect(comboMultiplier(3)).toBe(2);
    expect(comboMultiplier(20)).toBe(5);
  });
});

describe('nextCombo', () => {
  it('climbs within the window, resets after it closes', () => {
    expect(nextCombo(2, 5, 6)).toBe(3); // 5 <= 6 → continue
    expect(nextCombo(2, 7, 6)).toBe(1); // 7 > 6 → reset
  });
});

describe('rewardFor', () => {
  it('uses authored exp/coin × combo', () => {
    expect(rewardFor({ kind: 'collectible', expReward: 10, coinReward: 4 }, 1)).toEqual({ exp: 10, coin: 4 });
    expect(rewardFor({ kind: 'collectible', expReward: 10, coinReward: 4 }, 3)).toEqual({ exp: 20, coin: 8 }); // ×2
  });
  it('derives from value when no explicit reward', () => {
    expect(rewardFor({ kind: 'collectible', value: 2 }, 1)).toEqual({ exp: 10, coin: 4 });
  });
  it('stunt rings get a chain bonus', () => {
    expect(rewardFor({ kind: 'stunt_ring', expReward: 10, coinReward: 10 }, 1)).toEqual({ exp: 15, coin: 15 }); // ×1.5
  });
});
