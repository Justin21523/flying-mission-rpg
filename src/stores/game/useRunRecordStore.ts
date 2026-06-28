import { create } from 'zustand';
import type { RunMode } from './useArenaRunStore';

// Batch N — persistent best-score per arena mode (highest round reached). Saved via saveStore (slot save).
const TOP_N = 5;

interface RunRecordState {
  bestByMode: Record<string, number>;
  topByMode: Record<string, number[]>; // Wave 5 — top N rounds per mode (desc)
  record: (mode: RunMode, score: number) => void;
  getBest: (mode: RunMode) => number;
  getTop: (mode: RunMode) => number[];
  importState: (data: { bestByMode?: Record<string, number>; topByMode?: Record<string, number[]> }) => void;
  reset: () => void;
}

export const useRunRecordStore = create<RunRecordState>((set, get) => ({
  bestByMode: {},
  topByMode: {},
  record: (mode, score) => set((s) => ({
    bestByMode: { ...s.bestByMode, [mode]: Math.max(s.bestByMode[mode] ?? 0, score) },
    topByMode: { ...s.topByMode, [mode]: [...(s.topByMode[mode] ?? []), score].sort((a, b) => b - a).slice(0, TOP_N) },
  })),
  getBest: (mode) => get().bestByMode[mode] ?? 0,
  getTop: (mode) => get().topByMode[mode] ?? [],
  importState: (data) => set({
    bestByMode: data.bestByMode && typeof data.bestByMode === 'object' ? data.bestByMode : {},
    topByMode: data.topByMode && typeof data.topByMode === 'object' ? data.topByMode : {},
  }),
  reset: () => set({ bestByMode: {}, topByMode: {} }),
}));
