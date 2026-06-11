import type { HuntConfig } from '../../types/game/hunt';

// Pure auto-director roll: accumulate `timer`; once it passes the interval, reset and (with `chance`) start.
// Returns the next timer + whether to start a hunt. Disabled → never starts. Injectable rand for tests.
export function autoHuntRoll(
  cfg: Pick<HuntConfig, 'autoEnabled' | 'autoIntervalSec' | 'autoChance'>,
  timer: number,
  dt: number,
  rand: () => number = Math.random,
): { timer: number; start: boolean } {
  if (!cfg.autoEnabled) return { timer: 0, start: false };
  const t = timer + dt;
  if (t >= Math.max(2, cfg.autoIntervalSec)) return { timer: 0, start: rand() < cfg.autoChance };
  return { timer: t, start: false };
}
