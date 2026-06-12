import { create } from 'zustand';
import type { AutoSnapshot } from '../../game/testing/AutoPlaytester';

// Batch 13 — panel-facing state for the AutoPlaytester (debug/test only). The runtime singleton pushes its
// snapshot here; the panel reads it. `enabled` gates whether the director ticks.
const EMPTY: AutoSnapshot = {
  status: 'idle', currentPhase: null, lastAction: '', lastAssertion: '', elapsedMs: 0, failureReason: null, log: [],
};

interface AutoPlaytesterState {
  enabled: boolean;
  snap: AutoSnapshot;
  setEnabled: (b: boolean) => void;
  setSnap: (s: AutoSnapshot) => void;
}

export const useAutoPlaytesterStore = create<AutoPlaytesterState>((set) => ({
  enabled: false,
  snap: EMPTY,
  setEnabled: (enabled) => set({ enabled }),
  setSnap: (snap) => set({ snap }),
}));
