// Destination yokai-hunt config (the action mini-game played after landing). Authored in the 👹 Yokai/Hunt
// tab; consumed by the hunt runtime (huntStore + DestinationYokaiLayer). Reuses the POLI yokai AI/combat.
export interface HuntConfig {
  durationSec: number; // hunt length (endless spawn within this window; score = defeats)
  spawnIntervalSec: number; // seconds between spawn ticks
  maxActive: number; // perf cap on live yokai (oldest recycled beyond this)
  scoreNormal: number; // points per normal defeat (HUD)
  scoreElite: number; // points per elite defeat
  // Auto director — randomly start a hunt while at the destination (opt-in).
  autoEnabled: boolean;
  autoIntervalSec: number; // min seconds between auto-hunt rolls
  autoChance: number; // 0..1 chance per roll
}

export const DEFAULT_HUNT_CONFIG: HuntConfig = {
  durationSec: 60,
  spawnIntervalSec: 1.2,
  maxActive: 36,
  scoreNormal: 10,
  scoreElite: 30,
  autoEnabled: false,
  autoIntervalSec: 25,
  autoChance: 0.5,
};
