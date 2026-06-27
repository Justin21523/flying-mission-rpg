// Batch N — tuning for the arena run modes. Held as a single editable record (1-item editor collection in
// N3); getRunConfig() is the runtime accessor (swapped to read the store in N3). Endless escalates forever;
// Roguelite is a bounded run with buff choices between rounds.
export interface RunModeConfig {
  bossEveryN: number; // a boss round occurs every N rounds
  baseEnemies: number; // wave size at round 1
  enemiesPerRound: number; // extra enemies added per round
  maxEnemies: number; // cap on concurrent wave size
  hpScalePerRound: number; // +fraction of enemy maxHp per round
  dmgScalePerRound: number; // Batch P — +fraction of incoming player damage per round (late rounds bite)
  totalRounds?: number; // roguelite only — win after clearing this many
}

export interface RunConfig {
  id: 'run_config';
  endless: RunModeConfig;
  roguelite: RunModeConfig;
  startingLives: number;
  reviveCost: number; // coins to buy +1 life at game over
}

export const SEED_RUN_CONFIG: RunConfig = {
  id: 'run_config',
  endless: { bossEveryN: 5, baseEnemies: 3, enemiesPerRound: 1, maxEnemies: 10, hpScalePerRound: 0.12, dmgScalePerRound: 0.08 },
  roguelite: { bossEveryN: 3, baseEnemies: 3, enemiesPerRound: 1, maxEnemies: 9, hpScalePerRound: 0.16, dmgScalePerRound: 0.1, totalRounds: 12 },
  startingLives: 3,
  reviveCost: 200,
};
