import { create } from 'zustand';

// Wave 4 — enemy/boss codex + lifetime counters for challenge achievements. Player save-state (persisted via
// saveStore), mirrors useCharacterProgressionStore. Sets are stored as arrays for JSON save; deduped on add.
interface CodexState {
  seenEnemyIds: string[];
  defeatedBossIds: string[];
  executions: number; // Wave 2 finisher count (a challenge metric)
  challengeDone: Record<string, boolean>;
  recordEnemySeen: (enemyId: string | undefined) => void;
  recordBossDefeated: (bossId: string | undefined) => void;
  recordExecution: () => void;
  setChallengeDone: (id: string, done: boolean) => void;
  importState: (data: Partial<Pick<CodexState, 'seenEnemyIds' | 'defeatedBossIds' | 'executions' | 'challengeDone'>>) => void;
  reset: () => void;
}

export const useCodexStore = create<CodexState>((set, get) => ({
  seenEnemyIds: [],
  defeatedBossIds: [],
  executions: 0,
  challengeDone: {},

  recordEnemySeen: (enemyId) => { if (enemyId && !get().seenEnemyIds.includes(enemyId)) set({ seenEnemyIds: [...get().seenEnemyIds, enemyId] }); },
  recordBossDefeated: (bossId) => { if (bossId && !get().defeatedBossIds.includes(bossId)) set({ defeatedBossIds: [...get().defeatedBossIds, bossId] }); },
  recordExecution: () => set({ executions: get().executions + 1 }),
  setChallengeDone: (id, done) => set({ challengeDone: { ...get().challengeDone, [id]: done } }),

  importState: (data) => set({
    seenEnemyIds: Array.isArray(data.seenEnemyIds) ? data.seenEnemyIds : [],
    defeatedBossIds: Array.isArray(data.defeatedBossIds) ? data.defeatedBossIds : [],
    executions: typeof data.executions === 'number' ? data.executions : 0,
    challengeDone: data.challengeDone && typeof data.challengeDone === 'object' ? data.challengeDone : {},
  }),
  reset: () => set({ seenEnemyIds: [], defeatedBossIds: [], executions: 0, challengeDone: {} }),
}));
