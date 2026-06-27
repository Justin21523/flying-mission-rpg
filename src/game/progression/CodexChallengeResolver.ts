import { useCodexStore } from '../../stores/game/useCodexStore';
import { useCodexChallengeStore } from '../../stores/game/useCodexChallengeStore';
import { useWalletStore } from '../../stores/walletStore';
import type { ChallengeMetric } from '../../data/progression/codexChallenges';

// Wave 4 — read a codex metric's current value, and award challenges that newly hit their target (once).
export function currentMetric(metric: ChallengeMetric): number {
  const c = useCodexStore.getState();
  switch (metric) {
    case 'bosses-defeated': return c.defeatedBossIds.length;
    case 'enemies-seen': return c.seenEnemyIds.length;
    case 'executions': return c.executions;
  }
}

// Evaluate all challenges; mark newly-completed ones done + grant their coin reward. Idempotent (challengeDone
// guards against double-award). Call after any codex metric changes.
export function evaluateCodexChallenges(): void {
  const codex = useCodexStore.getState();
  for (const ch of useCodexChallengeStore.getState().items) {
    if (ch.enabled === false || codex.challengeDone[ch.id]) continue;
    if (currentMetric(ch.metric) >= ch.target) {
      codex.setChallengeDone(ch.id, true);
      if (ch.rewardCoins) useWalletStore.getState().addCoins(ch.rewardCoins);
    }
  }
}
