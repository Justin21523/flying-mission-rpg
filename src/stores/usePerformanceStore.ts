import { create } from 'zustand';
import type { RuntimeStats } from '../game/performance/RuntimeStatsCollector';

// Batch 12 — transient runtime-stats snapshot for the on-screen perf panel. NOT persisted and NOT a
// settings source — it just mirrors the PerformanceMonitor + RuntimeStatsCollector a few times a second
// (the in-canvas sampler calls `pushSnapshot`) so the DOM panel can render without per-frame churn.

export interface PerfSnapshot extends RuntimeStats {
  fps: number;
  frameTime: number;
  minFrameTime: number;
  maxFrameTime: number;
  memoryMb: number | null;
}

interface PerfStoreState {
  snapshot: PerfSnapshot;
  pushSnapshot: (s: PerfSnapshot) => void;
}

const EMPTY: PerfSnapshot = {
  fps: 0,
  frameTime: 0,
  minFrameTime: 0,
  maxFrameTime: 0,
  memoryMb: null,
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

export const usePerformanceStore = create<PerfStoreState>((set) => ({
  snapshot: EMPTY,
  pushSnapshot: (snapshot) => set({ snapshot }),
}));
