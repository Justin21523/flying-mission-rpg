import { create } from 'zustand';
import type { ResolvedFlightEnv } from '../../game/flight/flightCueRunner';

// Edit-Mode flight TIMELINE preview (🛩 Flight → Flight Preview). The flight "timeline" is route progress
// u∈[0,1]; FlightPreviewController drives a preview craft along the active scene's path from this store.
// Edit-only — never touches the play controllers or the FSM. Mirrors the transformation preview pattern.
// 'flight' makes the preview drive the real third-person FlightCamera (so the authored worldCam*/flyAroundCam*
// distance/height + craft scale are visible LIVE while you tune them); 'orbit' keeps the free user-orbit view.
export type FlightPreviewCameraMode = 'flight' | 'orbit';

interface FlightPreviewState {
  u: number; // 0..1 along the path
  playing: boolean;
  rangeEnd: number | null;
  speed: number; // u per second (≈ 1/seconds end-to-end)
  follow: boolean; // orbit target rides the craft (still user-rotatable)
  cameraMode: FlightPreviewCameraMode;
  camGizmo: boolean; // show the draggable per-leg flight-camera proxy in the preview
  activeCueClip: string; // animation-cue clip currently active ('' = none) — drives the preview craft's clip
  activeEnv: ResolvedFlightEnv | null; // active environment cue → drives the real sky + cloud density
  play: () => void;
  playRange: (startU: number, endU: number) => void;
  pause: () => void;
  stop: () => void;
  scrub: (u: number) => void;
  setSpeed: (s: number) => void;
  toggleFollow: () => void;
  setCameraMode: (m: FlightPreviewCameraMode) => void;
  toggleCamGizmo: () => void;
  setActiveCueClip: (c: string) => void;
  setActiveEnv: (e: ResolvedFlightEnv | null) => void;
  advance: (dt: number) => void;
}

function envEq(a: ResolvedFlightEnv | null, b: ResolvedFlightEnv | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.skyTop === b.skyTop && a.skyBottom === b.skyBottom && a.fogDensity === b.fogDensity && a.cloudHint === b.cloudHint;
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export const useFlightPreviewStore = create<FlightPreviewState>((set) => ({
  u: 0,
  playing: false,
  rangeEnd: null,
  speed: 0.12,
  follow: true,
  cameraMode: 'flight',
  camGizmo: false,
  activeCueClip: '',
  activeEnv: null,
  play: () => set({ playing: true, rangeEnd: null }),
  playRange: (startU, endU) => set({ u: clamp01(startU), playing: true, rangeEnd: Math.max(clamp01(startU), clamp01(endU)) }),
  pause: () => set({ playing: false, rangeEnd: null }),
  stop: () => set({ playing: false, rangeEnd: null, u: 0, activeCueClip: '', activeEnv: null }),
  scrub: (u) => set({ u: clamp01(u), playing: false, rangeEnd: null }),
  setSpeed: (speed) => set({ speed: Math.max(0.01, speed) }),
  toggleFollow: () => set((s) => ({ follow: !s.follow })),
  setCameraMode: (cameraMode) => set({ cameraMode }),
  toggleCamGizmo: () => set((s) => ({ camGizmo: !s.camGizmo })),
  setActiveCueClip: (c) => { if (useFlightPreviewStore.getState().activeCueClip !== c) set({ activeCueClip: c }); },
  setActiveEnv: (e) => { if (!envEq(useFlightPreviewStore.getState().activeEnv, e)) set({ activeEnv: e }); },
  advance: (dt) =>
    set((s) => {
      if (!s.playing) return s;
      let u = s.u + dt * s.speed;
      if (s.rangeEnd !== null) {
        const end = clamp01(s.rangeEnd);
        return u >= end ? { u: end, playing: false, rangeEnd: null } : { u: clamp01(u) };
      }
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
