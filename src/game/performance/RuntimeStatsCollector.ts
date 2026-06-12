// Batch 12 — a tiny central registry where subsystems report live counts (active chunks, particles,
// pooled objects, character tiers, AI ticks…). Pull-based and allocation-free: systems call reportStat
// in their existing ticks; the perf panel reads the snapshot. Unknown/unreported stats stay at 0.

export interface RuntimeStats {
  activeChunks: number;
  flightEvents: number;
  particles: number;
  effects: number;
  poolActive: number;
  poolIdle: number;
  activeCharacters: number;
  standbyCharacters: number;
  remoteCharacters: number;
  aiTicks: number;
  audioPlaying: number;
}

export type RuntimeStatKey = keyof RuntimeStats;

const stats: RuntimeStats = {
  activeChunks: 0,
  flightEvents: 0,
  particles: 0,
  effects: 0,
  poolActive: 0,
  poolIdle: 0,
  activeCharacters: 0,
  standbyCharacters: 0,
  remoteCharacters: 0,
  aiTicks: 0,
  audioPlaying: 0,
};

export function reportStat(key: RuntimeStatKey, value: number): void {
  stats[key] = value;
}

export function bumpStat(key: RuntimeStatKey, delta = 1): void {
  stats[key] += delta;
}

export function getRuntimeStats(): RuntimeStats {
  return { ...stats };
}

export function resetRuntimeStats(): void {
  (Object.keys(stats) as RuntimeStatKey[]).forEach((k) => { stats[k] = 0; });
}
