import { create } from 'zustand';

// Flight runtime: where we are, which route, and live progress. The real flight controller (Batch 4/5)
// will drive `progress`/`speed`; this batch just holds the shape so the FSM + debug console can read it.
interface FlightStore {
  currentLocationId: string | null;
  currentRouteId: string | null;
  progress: number; // 0..1 along the active route
  speed: number; // abstract units/sec
  setLocation: (id: string | null) => void;
  setRoute: (id: string | null) => void;
  setProgress: (p: number) => void;
  setSpeed: (s: number) => void;
  reset: () => void;
}

export const useFlightStore = create<FlightStore>((set) => ({
  currentLocationId: null,
  currentRouteId: null,
  progress: 0,
  speed: 0,
  setLocation: (currentLocationId) => set({ currentLocationId }),
  setRoute: (currentRouteId) => set({ currentRouteId }),
  setProgress: (progress) => set({ progress: Math.max(0, Math.min(1, progress)) }),
  setSpeed: (speed) => set({ speed: Math.max(0, speed) }),
  reset: () => set({ currentLocationId: null, currentRouteId: null, progress: 0, speed: 0 }),
}));
