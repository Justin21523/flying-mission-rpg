// Wave 4 — codex challenge achievements. Each tracks a lifetime metric to a target; completing one (once)
// grants a coin reward. Editable in the ⬆ Progression tab.
export type ChallengeMetric = 'bosses-defeated' | 'enemies-seen' | 'executions';
export const CHALLENGE_METRICS: readonly ChallengeMetric[] = ['bosses-defeated', 'enemies-seen', 'executions'];

export interface CodexChallengeDefinition {
  id: string;
  name: string;
  description: string;
  metric: ChallengeMetric;
  target: number;
  rewardCoins?: number;
  enabled?: boolean;
  editorMeta?: { icon?: string };
}

export const SEED_CODEX_CHALLENGES: CodexChallengeDefinition[] = [
  { id: 'chal_boss_hunter', name: 'Boss Hunter', description: 'Defeat 5 different bosses.', metric: 'bosses-defeated', target: 5, rewardCoins: 300, enabled: true, editorMeta: { icon: '👹' } },
  { id: 'chal_boss_master', name: 'Boss Master', description: 'Defeat 10 different bosses.', metric: 'bosses-defeated', target: 10, rewardCoins: 600, enabled: true, editorMeta: { icon: '👑' } },
  { id: 'chal_naturalist', name: 'Field Naturalist', description: 'Encounter 12 enemy types.', metric: 'enemies-seen', target: 12, rewardCoins: 250, enabled: true, editorMeta: { icon: '📖' } },
  { id: 'chal_executioner', name: 'Executioner', description: 'Finish 15 enemies with executions.', metric: 'executions', target: 15, rewardCoins: 300, enabled: true, editorMeta: { icon: '🗡' } },
];
