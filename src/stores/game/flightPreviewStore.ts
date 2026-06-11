import { create } from 'zustand';

// Edit-Mode flight TIMELINE preview (🛩 Flight → Flight Preview). The flight "timeline" is route progress
// u∈[0,1]; FlightPreviewController drives a preview craft along the active scene's path from this store.
// Edit-only — never touches the play controllers or the FSM. Mirrors the transformation preview pattern.
interface FlightPreviewState {
  u: number; // 0..1 along the path
  playing: boolean;
  speed: number; // u per second (≈ 1/seconds end-to-end)
  follow: boolean; // orbit target rides the craft (still user-rotatable)
  play: () => void;
  pause: () => void;
  stop: () => void;
  scrub: (u: number) => void;
  setSpeed: (s: number) => void;
  toggleFollow: () => void;
  advance: (dt: number) => void;
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export const useFlightPreviewStore = create<FlightPreviewState>((set) => ({
  u: 0,
  playing: false,
  speed: 0.12,
  follow: true,
  play: () => set({ playing: true }),
  pause: () => set({ playing: false }),
  stop: () => set({ playing: false, u: 0 }),
  scrub: (u) => set({ u: clamp01(u), playing: false }),
  setSpeed: (speed) => set({ speed: Math.max(0.01, speed) }),
  toggleFollow: () => set((s) => ({ follow: !s.follow })),
  advance: (dt) =>
    set((s) => {
      if (!s.playing) return s;
      let u = s.u + dt * s.speed;
      if (u >= 1) u -= 1; // loop for continuous debugging
      return { u: clamp01(u) };
    }),
}));

// Non-reactive readout for the panel (polled — no per-frame React writes).
export const flightPreviewHandle = { u: 0, altitude: 0, pathSpeed: 0 };

export function previewActive(): boolean {
  const s = useFlightPreviewStore.getState();
  return s.playing || s.u > 0.001;
}
