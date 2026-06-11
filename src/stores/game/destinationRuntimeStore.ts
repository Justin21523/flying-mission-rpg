import { create } from 'zustand';
import type { LandingEvaluation } from '../../game/destination/safeLanding';

export interface DestinationRuntimeSnapshot {
  evaluation: LandingEvaluation | null;
  prompt: string | null;
  carryingId: string | null;
  collectedIds: string[];
}

// Discrete destination-phase UI state (landing result, interaction prompt, carried item). The continuous
// robot transform lives in the non-reactive robotHandle (polled).
interface DestinationRuntimeState {
  evaluation: LandingEvaluation | null;
  prompt: string | null; // current [E] prompt text
  carryingId: string | null; // carry-item part id currently attached to the robot
  collectedIds: string[]; // mission-object part ids already picked up / resolved (hidden in 3D)
  interactionOwnerId: string | null;
  setEvaluation: (e: LandingEvaluation | null) => void;
  setPrompt: (p: string | null) => void;
  setInteractionOwner: (id: string | null) => void;
  setCarrying: (id: string | null) => void;
  addCollected: (id: string) => void;
  snapshot: () => DestinationRuntimeSnapshot;
  restore: (snapshot: DestinationRuntimeSnapshot) => void;
  reset: () => void;
}

export const useDestinationRuntimeStore = create<DestinationRuntimeState>((set, get) => ({
  evaluation: null,
  prompt: null,
  carryingId: null,
  collectedIds: [],
  interactionOwnerId: null,
  setEvaluation: (evaluation) => set({ evaluation }),
  setPrompt: (prompt) => set((s) => (s.prompt === prompt ? s : { prompt })),
  setInteractionOwner: (interactionOwnerId) => set((s) => (s.interactionOwnerId === interactionOwnerId ? s : { interactionOwnerId })),
  setCarrying: (carryingId) => set({ carryingId }),
  addCollected: (id) => set((s) => (s.collectedIds.includes(id) ? s : { collectedIds: [...s.collectedIds, id] })),
  snapshot: () => {
    const s = get();
    return { evaluation: s.evaluation, prompt: s.prompt, carryingId: s.carryingId, collectedIds: [...s.collectedIds] };
  },
  restore: (snapshot) => set({
    evaluation: snapshot.evaluation,
    prompt: snapshot.prompt,
    carryingId: snapshot.carryingId,
    collectedIds: [...snapshot.collectedIds],
  }),
  reset: () => set({ evaluation: null, prompt: null, carryingId: null, collectedIds: [], interactionOwnerId: null }),
}));
