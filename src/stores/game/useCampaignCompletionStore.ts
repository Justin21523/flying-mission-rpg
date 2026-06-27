import { create } from 'zustand';

// Wave 4 — records campaign clear (final boss defeated) to unlock New Game+. Player save-state (persisted via
// saveStore), mirrors useCharacterProgressionStore's simple shape.
interface CampaignCompletionState {
  finalBossDefeated: boolean;
  completedAtSeconds?: number;
  markFinalBossDefeated: (atSeconds?: number) => void;
  importState: (data: { finalBossDefeated?: boolean; completedAtSeconds?: number }) => void;
  reset: () => void;
}

export const useCampaignCompletionStore = create<CampaignCompletionState>((set, get) => ({
  finalBossDefeated: false,
  completedAtSeconds: undefined,
  markFinalBossDefeated: (atSeconds) => { if (!get().finalBossDefeated) set({ finalBossDefeated: true, completedAtSeconds: atSeconds }); },
  importState: (data) => set({ finalBossDefeated: !!data.finalBossDefeated, completedAtSeconds: data.completedAtSeconds }),
  reset: () => set({ finalBossDefeated: false, completedAtSeconds: undefined }),
}));

// Wave 4 — NG+ is selectable once the campaign is cleared.
export function ngPlusUnlocked(): boolean {
  return useCampaignCompletionStore.getState().finalBossDefeated;
}
