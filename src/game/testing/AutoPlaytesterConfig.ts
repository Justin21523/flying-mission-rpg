// Batch 13 — AutoPlaytester tuning. Debug/test only.
export const AUTO_PLAYTESTER_CONFIG = {
  actionIntervalMs: 300,   // min gap between issuing actions for the current phase
  stepTimeoutMs: 15_000,   // a single phase taking longer than this → failed (stuck)
  totalTimeoutMs: 120_000, // whole run cap
};
