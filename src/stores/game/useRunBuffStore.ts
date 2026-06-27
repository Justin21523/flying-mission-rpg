import { create } from 'zustand';

// Batch N — RUN-scoped buffs the player has picked this run (non-persistent; reset each run). Duplicates are
// allowed (stacking the same buff across rounds). The resolver aggregates these into combat multipliers.
interface RunBuffState {
  selectedBuffIds: string[];
  addBuff: (id: string) => void;
  resetRun: () => void;
}

export const useRunBuffStore = create<RunBuffState>((set) => ({
  selectedBuffIds: [],
  addBuff: (id) => set((s) => ({ selectedBuffIds: [...s.selectedBuffIds, id] })),
  resetRun: () => set({ selectedBuffIds: [] }),
}));
