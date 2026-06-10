import { create } from 'zustand';

// Discrete world-flight UI state (the continuous transform/progress lives in flightHandle, polled).
interface WorldFlightRuntimeState {
  activeEventLabel: string | null;
  radioText: string | null;
  collectibles: number;
  energy: number;
  arrived: boolean;
  setActiveEvent: (label: string | null) => void;
  setRadio: (text: string | null) => void;
  addCollectible: (n: number) => void;
  addEnergy: (n: number) => void;
  setArrived: (v: boolean) => void;
  reset: () => void;
}

export const useWorldFlightRuntimeStore = create<WorldFlightRuntimeState>((set) => ({
  activeEventLabel: null,
  radioText: null,
  collectibles: 0,
  energy: 100,
  arrived: false,
  setActiveEvent: (activeEventLabel) => set({ activeEventLabel }),
  setRadio: (radioText) => set({ radioText }),
  addCollectible: (n) => set((s) => ({ collectibles: s.collectibles + n })),
  addEnergy: (n) => set((s) => ({ energy: Math.max(0, Math.min(100, s.energy + n)) })),
  setArrived: (arrived) => set({ arrived }),
  reset: () => set({ activeEventLabel: null, radioText: null, collectibles: 0, energy: 100, arrived: false }),
}));
