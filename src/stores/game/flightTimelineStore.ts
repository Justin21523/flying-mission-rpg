import { create } from 'zustand';
import { getActiveFlightPhase } from './flightPhaseStore';

// Seconds-based Flight Phase timeline / editor-UI runtime. Drives the bottom-left playback overlay, the
// scrubber, keyframe/event selection and the editor camera view presets. Edit-only state; the actual flight
// data lives in flightPhaseStore (the single source of truth). Supersedes the old u∈[0,1] flightPreviewStore
// role for this phase. `currentTime` is what every 3D host evaluates against, so scrubbing = instant preview.

export type FlightViewMode = 'overview' | 'top' | 'side' | 'front' | 'follow' | 'free';
export const FLIGHT_VIEW_MODES: FlightViewMode[] = ['overview', 'top', 'side', 'front', 'follow', 'free'];
export type FlightTransformMode = 'translate' | 'rotate' | 'scale';
export const PLAYBACK_SPEEDS = [0.25, 0.5, 1, 2] as const;

interface FlightTimelineState {
  currentTime: number;
  totalDuration: number;
  playing: boolean;
  playbackSpeed: number;
  loop: boolean;
  scrubPreview: boolean;
  selectedNodeId: string | null;
  selectedKeyframeId: string | null;
  selectedEventId: string | null;
  viewMode: FlightViewMode;
  viewNonce: number;          // bumped when a view preset is (re)applied → camera re-snaps
  transformMode: FlightTransformMode;
  showPathGizmos: boolean;
  showCameraGizmos: boolean;
  showEventMarkers: boolean;
  cameraPreview: boolean;     // edit mode: drive the camera from the authored keyframes at currentTime
  // transport
  play: () => void;
  pause: () => void;
  stop: () => void;
  restart: () => void;
  scrub: (t: number) => void;
  advance: (dt: number) => void;
  setSpeed: (s: number) => void;
  toggleLoop: () => void;
  toggleScrubPreview: () => void;
  setTotalDuration: (d: number) => void;
  nextKeyframe: () => void;
  prevKeyframe: () => void;
  resetPreview: () => void;
  // selection / view
  selectNode: (id: string | null) => void;
  selectKeyframe: (id: string | null) => void;
  selectEvent: (id: string | null) => void;
  setViewMode: (m: FlightViewMode) => void;
  reapplyView: () => void;
  setTransformMode: (m: FlightTransformMode) => void;
  toggleGizmo: (which: 'path' | 'camera' | 'event') => void;
  toggleCameraPreview: () => void;
}

const clampT = (t: number, max: number) => (t < 0 ? 0 : t > max ? max : t);

// All keyframe + event times (sorted) of the active phase — used for prev/next stepping + slider ticks.
export function activeMarkerTimes(): number[] {
  const p = getActiveFlightPhase();
  if (!p) return [];
  const ts = [0, p.totalDuration, ...p.cameraKeyframes.map((k) => k.time), ...p.events.map((e) => e.time)];
  return [...new Set(ts.map((t) => Math.round(t * 1000) / 1000))].sort((a, b) => a - b);
}

export const useFlightTimelineStore = create<FlightTimelineState>((set, get) => ({
  currentTime: 0,
  totalDuration: getActiveFlightPhase()?.totalDuration ?? 0,
  playing: false,
  playbackSpeed: 1,
  loop: false,
  scrubPreview: true,
  selectedNodeId: null,
  selectedKeyframeId: null,
  selectedEventId: null,
  viewMode: 'overview',
  viewNonce: 0,
  transformMode: 'translate',
  showPathGizmos: true,
  showCameraGizmos: true,
  showEventMarkers: true,
  cameraPreview: false,

  play: () => set({ playing: true }),
  pause: () => set({ playing: false }),
  stop: () => set({ playing: false, currentTime: 0 }),
  restart: () => set({ playing: true, currentTime: 0 }),
  scrub: (t) => set({ currentTime: clampT(t, get().totalDuration || Infinity), playing: false }),
  advance: (dt) => set((s) => {
    if (!s.playing) return s;
    const max = s.totalDuration || 0;
    let t = s.currentTime + dt * s.playbackSpeed;
    if (t >= max) {
      if (s.loop) t = t % Math.max(0.001, max);
      else return { currentTime: max, playing: false };
    }
    return { currentTime: t };
  }),
  setSpeed: (playbackSpeed) => set({ playbackSpeed }),
  toggleLoop: () => set((s) => ({ loop: !s.loop })),
  toggleScrubPreview: () => set((s) => ({ scrubPreview: !s.scrubPreview })),
  setTotalDuration: (d) => set((s) => (Math.abs(s.totalDuration - d) > 1e-3 ? { totalDuration: d, currentTime: Math.min(s.currentTime, d) } : s)),
  nextKeyframe: () => set((s) => { const next = activeMarkerTimes().find((t) => t > s.currentTime + 1e-3); return { currentTime: next ?? s.totalDuration, playing: false }; }),
  prevKeyframe: () => set((s) => { const prev = [...activeMarkerTimes()].reverse().find((t) => t < s.currentTime - 1e-3); return { currentTime: prev ?? 0, playing: false }; }),
  resetPreview: () => set({ playing: false, currentTime: 0, selectedNodeId: null, selectedKeyframeId: null, selectedEventId: null }),

  selectNode: (selectedNodeId) => set({ selectedNodeId, selectedKeyframeId: null, selectedEventId: null }),
  selectKeyframe: (selectedKeyframeId) => set({ selectedKeyframeId, selectedNodeId: null, selectedEventId: null }),
  selectEvent: (selectedEventId) => set({ selectedEventId, selectedNodeId: null, selectedKeyframeId: null }),
  setViewMode: (viewMode) => set((s) => ({ viewMode, viewNonce: s.viewNonce + 1 })),
  reapplyView: () => set((s) => ({ viewNonce: s.viewNonce + 1 })),
  setTransformMode: (transformMode) => set({ transformMode }),
  toggleGizmo: (which) => set((s) => ({
    showPathGizmos: which === 'path' ? !s.showPathGizmos : s.showPathGizmos,
    showCameraGizmos: which === 'camera' ? !s.showCameraGizmos : s.showCameraGizmos,
    showEventMarkers: which === 'event' ? !s.showEventMarkers : s.showEventMarkers,
  })),
  toggleCameraPreview: () => set((s) => ({ cameraPreview: !s.cameraPreview })),
}));

// Non-reactive readout for polled panels.
export const flightTimelineHandle = { currentTime: 0, altitude: 0, speed: 0 };
