// Batch 13 / post-13 — AutoPlaytester tuning. Debug/test only.
export interface AutoPlaytesterConfig {
  actionIntervalMs: number;  // min gap between issuing actions for the current phase
  stepTimeoutMs: number;     // a single phase taking longer than this → failed (stuck)
  totalTimeoutMs: number;    // whole run cap
  realFlight: boolean;       // true = steer the 3D controllers with real input; false = debug fast-forward
  flightFallbackMs: number;  // after this long in an auto-flight phase, fall back to the debug hook
}

export const AUTO_PLAYTESTER_CONFIG: AutoPlaytesterConfig = {
  actionIntervalMs: 300,
  stepTimeoutMs: 15_000,
  totalTimeoutMs: 120_000,
  realFlight: true,
  flightFallbackMs: 4_000,
};
