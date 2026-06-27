import type { RunMode } from '../../stores/game/useArenaRunStore';
import type { RunModeConfig } from '../../data/progression/runConfig';

// Batch N — PURE arena-run decisions (no side effects, no store reads) so the loop is unit-testable. The
// RunDirector wires these to spawning/boss/lives side effects.

// Enemy ids unlocked by round tier (escalating roster). All exist in the enemy roster.
const TIERS: { fromRound: number; ids: string[] }[] = [
  { fromRound: 1, ids: ['crusher_drone', 'zip_glitch'] },
  { fromRound: 3, ids: ['pulse_turret', 'shield_carrier', 'drone_swarm'] },
  { fromRound: 6, ids: ['quake_walker', 'sniper_node', 'glitch_spawner'] },
  { fromRound: 9, ids: ['elite_sentinel', 'barrier_node', 'hazard_core'] },
];

export function availableEnemyIds(round: number): string[] {
  return TIERS.filter((t) => round >= t.fromRound).flatMap((t) => t.ids);
}

export function isBossRound(round: number, cfg: RunModeConfig): boolean {
  return cfg.bossEveryN > 0 && round % cfg.bossEveryN === 0;
}

export function enemyHpScale(round: number, cfg: RunModeConfig): number {
  return 1 + Math.max(0, round - 1) * cfg.hpScalePerRound;
}

export function waveSize(round: number, cfg: RunModeConfig): number {
  return Math.min(cfg.maxEnemies, cfg.baseEnemies + Math.floor(Math.max(0, round - 1) * cfg.enemiesPerRound));
}

// Deterministic wave composition (cycles the available roster) → testable + escalates as tiers unlock.
export function waveForRound(round: number, cfg: RunModeConfig): { enemyId: string; count: number }[] {
  const ids = availableEnemyIds(round);
  const size = waveSize(round, cfg);
  const counts: Record<string, number> = {};
  for (let i = 0; i < size; i++) {
    const id = ids[i % ids.length];
    counts[id] = (counts[id] ?? 0) + 1;
  }
  return Object.entries(counts).map(([enemyId, count]) => ({ enemyId, count }));
}

// Roguelite wins after clearing totalRounds; Endless never wins.
export function isRunWon(mode: RunMode, round: number, cfg: RunModeConfig): boolean {
  return mode === 'roguelite' && cfg.totalRounds != null && round > cfg.totalRounds;
}

// Which boss (index into the boss-id list) for a given boss round — cycles through the roster.
export function bossIndexForRound(round: number, cfg: RunModeConfig, bossCount: number): number {
  if (bossCount <= 0) return 0;
  const n = Math.max(1, Math.floor(round / Math.max(1, cfg.bossEveryN)));
  return (n - 1) % bossCount;
}
