import { create } from 'zustand';
import type { LandingEvaluation } from '../../game/destination/safeLanding';

// Discrete destination-phase UI state (landing result, interaction prompt, carried item). The continuous
// robot transform lives in the non-reactive robotHandle (polled).
interface DestinationRuntimeState {
  evaluation: LandingEvaluation | null;
  prompt: string | null; // current [E] prompt text
  carryingId: string | null; // carry-item part id currently attached to the robot
  collectedIds: string[]; // mission-object part ids already picked up / resolved (hidden in 3D)
  setEvaluation: (e: LandingEvaluation | null) => void;
  setPrompt: (p: string | null) => void;
  setCarrying: (id: string | null) => void;
  addCollected: (id: string) => void;
  reset: () => void;
}

export const useDestinationRuntimeStore = create<DestinationRuntimeState>((set) => ({
  evaluation: null,
  prompt: null,
  carryingId: null,
  collectedIds: [],
  setEvaluation: (evaluation) => set({ evaluation }),
  setPrompt: (prompt) => set((s) => (s.prompt === prompt ? s : { prompt })),
  setCarrying: (carryingId) => set({ carryingId }),
  addCollected: (id) => set((s) => (s.collectedIds.includes(id) ? s : { collectedIds: [...s.collectedIds, id] })),
  reset: () => set({ evaluation: null, prompt: null, carryingId: null, collectedIds: [] }),
}));
