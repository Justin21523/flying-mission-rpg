import { describe, it, expect, beforeEach } from 'vitest';
import { evaluateCodexChallenges, currentMetric } from './CodexChallengeResolver';
import { useCodexStore } from '../../stores/game/useCodexStore';
import { useCodexChallengeStore } from '../../stores/game/useCodexChallengeStore';
import { useWalletStore } from '../../stores/walletStore';
import { SEED_CODEX_CHALLENGES } from '../../data/progression/codexChallenges';

beforeEach(() => {
  useCodexChallengeStore.getState().importState({ items: SEED_CODEX_CHALLENGES });
  useCodexStore.getState().reset();
  useWalletStore.getState().reset();
});

describe('Wave 4 codex challenges', () => {
  it('currentMetric reflects the codex counters', () => {
    useCodexStore.getState().recordBossDefeated('b1');
    useCodexStore.getState().recordBossDefeated('b1'); // dedup
    useCodexStore.getState().recordBossDefeated('b2');
    expect(currentMetric('bosses-defeated')).toBe(2);
  });

  it('marks a challenge done + grants its reward once the target is hit', () => {
    for (let i = 0; i < 5; i++) useCodexStore.getState().recordBossDefeated('boss_' + i);
    evaluateCodexChallenges();
    expect(useCodexStore.getState().challengeDone['chal_boss_hunter']).toBe(true);
    expect(useWalletStore.getState().coins).toBe(300); // Boss Hunter reward
  });

  it('does not double-award a completed challenge', () => {
    for (let i = 0; i < 5; i++) useCodexStore.getState().recordBossDefeated('boss_' + i);
    evaluateCodexChallenges();
    const coins = useWalletStore.getState().coins;
    useCodexStore.getState().recordBossDefeated('boss_extra');
    evaluateCodexChallenges();
    expect(useWalletStore.getState().coins).toBe(coins); // no extra payout
  });

  it('leaves an unmet challenge incomplete', () => {
    useCodexStore.getState().recordBossDefeated('b1');
    evaluateCodexChallenges();
    expect(useCodexStore.getState().challengeDone['chal_boss_hunter']).toBeFalsy();
  });
});
