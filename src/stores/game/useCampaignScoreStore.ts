import { create } from 'zustand';
import type { Difficulty } from '../../types/game/settings';
import type { CampaignRunRecord } from '../../data/progression/campaignScore';

// Wave 5 — campaign score leaderboard (per-completion run history). Player save-state (persisted via saveStore),
// mirrors useRunRecordStore. Runs are kept sorted by score desc, capped per store.
const MAX_RUNS = 50;

interface CampaignScoreState {
  runs: CampaignRunRecord[];
  recordRun: (run: CampaignRunRecord) => void;
  topByDifficulty: (difficulty: Difficulty, n: number) => CampaignRunRecord[];
  bestScore: (difficulty: Difficulty) => number;
  importState: (data: { runs?: CampaignRunRecord[] }) => void;
  reset: () => void;
}

export const useCampaignScoreStore = create<CampaignScoreState>((set, get) => ({
  runs: [],
  recordRun: (run) => set((s) => ({ runs: [...s.runs, run].sort((a, b) => b.score - a.score).slice(0, MAX_RUNS) })),
  topByDifficulty: (difficulty, n) => get().runs.filter((r) => r.difficulty === difficulty).slice(0, n),
  bestScore: (difficulty) => get().runs.filter((r) => r.difficulty === difficulty).reduce((m, r) => Math.max(m, r.score), 0),
  importState: (data) => set({ runs: Array.isArray(data.runs) ? [...data.runs].sort((a, b) => b.score - a.score).slice(0, MAX_RUNS) : [] }),
  reset: () => set({ runs: [] }),
}));
