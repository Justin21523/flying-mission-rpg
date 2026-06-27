import { describe, it, expect } from 'vitest';
import { availableEnemyIds, isBossRound, enemyHpScale, waveSize, waveForRound, isRunWon, bossIndexForRound } from './runMath';
import { SEED_RUN_CONFIG } from '../../data/progression/runConfig';

const E = SEED_RUN_CONFIG.endless;
const R = SEED_RUN_CONFIG.roguelite;

describe('runMath', () => {
  it('unlocks tougher enemy tiers as rounds rise', () => {
    expect(availableEnemyIds(1)).toEqual(['crusher_drone', 'zip_glitch']);
    expect(availableEnemyIds(3).length).toBeGreaterThan(availableEnemyIds(1).length);
    expect(availableEnemyIds(9)).toContain('elite_sentinel');
  });

  it('boss round every Nth (endless N=5, roguelite N=3)', () => {
    expect(isBossRound(5, E)).toBe(true);
    expect(isBossRound(4, E)).toBe(false);
    expect(isBossRound(3, R)).toBe(true);
    expect(isBossRound(6, R)).toBe(true);
  });

  it('enemy HP scales up with round, neutral at round 1', () => {
    expect(enemyHpScale(1, E)).toBe(1);
    expect(enemyHpScale(6, E)).toBeCloseTo(1 + 5 * E.hpScalePerRound, 5);
  });

  it('wave size grows and is capped at maxEnemies', () => {
    expect(waveSize(1, E)).toBe(E.baseEnemies);
    expect(waveSize(50, E)).toBe(E.maxEnemies);
  });

  it('waveForRound is deterministic and sums to the wave size', () => {
    const w1 = waveForRound(7, E);
    const w2 = waveForRound(7, E);
    expect(w1).toEqual(w2); // deterministic
    expect(w1.reduce((s, e) => s + e.count, 0)).toBe(waveSize(7, E));
    for (const e of w1) expect(availableEnemyIds(7)).toContain(e.enemyId);
  });

  it('roguelite wins after clearing totalRounds; endless never wins', () => {
    expect(isRunWon('roguelite', (R.totalRounds ?? 0) + 1, R)).toBe(true);
    expect(isRunWon('roguelite', R.totalRounds ?? 0, R)).toBe(false);
    expect(isRunWon('endless', 9999, E)).toBe(false);
  });

  it('boss index cycles through the roster', () => {
    expect(bossIndexForRound(5, E, 10)).toBe(0); // 1st boss round → index 0
    expect(bossIndexForRound(10, E, 10)).toBe(1); // 2nd boss round → index 1
    expect(bossIndexForRound(5, E, 0)).toBe(0); // empty roster guard
  });
});
