import { create } from 'zustand';
import type { FlightMode } from '../../types/game/flightControl';

// Discrete flight UI state (mode/comfort/nav progress). The continuous transform (pos/quat/speed) lives
// in the non-reactive flightHandle to avoid per-frame re-renders.
interface FlightRuntimeState {
  mode: FlightMode;
  comfort: boolean;
  navIndex: number; // next navpoint to reach
  setMode: (mode: FlightMode) => void;
  toggleComfort: () => void;
  setNavIndex: (i: number) => void;
  reset: () => void;
}

export const useFlightRuntimeStore = create<FlightRuntimeState>((set) => ({
  mode: 'simple',
  comfort: false,
  navIndex: 0,
  setMode: (mode) => set({ mode }),
  toggleComfort: () => set((s) => ({ comfort: !s.comfort })),
  setNavIndex: (navIndex) => set({ navIndex }),
  reset: () => set({ navIndex: 0 }),
}));
