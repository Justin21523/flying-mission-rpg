import { describe, it, expect, beforeEach } from 'vitest';
import { computeCampaignScore } from '../../data/progression/campaignScore';
import { useCampaignScoreStore } from '../../stores/game/useCampaignScoreStore';
import { useRunRecordStore } from '../../stores/game/useRunRecordStore';

const base = { elapsedSeconds: 60, kills: 50, bossesDefeated: 6 } as const;

describe('Wave 5 campaign score', () => {
  it('scales with difficulty (ng-plus highest)', () => {
    const easy = computeCampaignScore({ ...base, difficulty: 'easy' });
    const normal = computeCampaignScore({ ...base, difficulty: 'normal' });
    const hard = computeCampaignScore({ ...base, difficulty: 'hard' });
    const ng = computeCampaignScore({ ...base, difficulty: 'ng-plus' });
    expect(easy).toBeLessThan(normal);
    expect(normal).toBeLessThan(hard);
    expect(hard).toBeLessThan(ng);
  });

  it('faster clears score higher (time penalty)', () => {
    const fast = computeCampaignScore({ ...base, elapsedSeconds: 30, difficulty: 'normal' });
    const slow = computeCampaignScore({ ...base, elapsedSeconds: 300, difficulty: 'normal' });
    expect(fast).toBeGreaterThan(slow);
  });

  it('never goes negative', () => {
    expect(computeCampaignScore({ elapsedSeconds: 99999, kills: 0, bossesDefeated: 0, difficulty: 'easy' })).toBeGreaterThanOrEqual(0);
  });
});

describe('Wave 5 score stores', () => {
  beforeEach(() => { useCampaignScoreStore.getState().reset(); useRunRecordStore.getState().reset(); });

  it('campaign runs sort by score desc + topByDifficulty filters', () => {
    const mk = (score: number) => ({ score, difficulty: 'hard' as const, elapsedSeconds: 60, kills: 10, completedAtIso: 'x' });
    useCampaignScoreStore.getState().recordRun(mk(100));
    useCampaignScoreStore.getState().recordRun(mk(300));
    useCampaignScoreStore.getState().recordRun(mk(200));
    const top = useCampaignScoreStore.getState().topByDifficulty('hard', 2);
    expect(top.map((r) => r.score)).toEqual([300, 200]);
    expect(useCampaignScoreStore.getState().bestScore('hard')).toBe(300);
  });

  it('arena top-N keeps the 5 best rounds desc', () => {
    for (const r of [3, 9, 1, 7, 5, 8, 2]) useRunRecordStore.getState().record('endless', r);
    expect(useRunRecordStore.getState().getTop('endless')).toEqual([9, 8, 7, 5, 3]);
    expect(useRunRecordStore.getState().getBest('endless')).toBe(9);
  });
});
