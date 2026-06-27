import { create } from 'zustand';
import type { RunMode } from './useArenaRunStore';

// Batch N — persistent best-score per arena mode (highest round reached). Saved via saveStore (slot save).
interface RunRecordState {
  bestByMode: Record<string, number>;
  record: (mode: RunMode, score: number) => void;
  getBest: (mode: RunMode) => number;
  importState: (data: { bestByMode?: Record<string, number> }) => void;
  reset: () => void;
}

export const useRunRecordStore = create<RunRecordState>((set, get) => ({
  bestByMode: {},
  record: (mode, score) => set((s) => ({ bestByMode: { ...s.bestByMode, [mode]: Math.max(s.bestByMode[mode] ?? 0, score) } })),
  getBest: (mode) => get().bestByMode[mode] ?? 0,
  importState: (data) => set({ bestByMode: data.bestByMode && typeof data.bestByMode === 'object' ? data.bestByMode : {} }),
  reset: () => set({ bestByMode: {} }),
}));
