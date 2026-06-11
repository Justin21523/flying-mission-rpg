import { create } from 'zustand';
import type { TransformationMode } from '../../types/game/transformation';

// Edit-Mode preview controls for the ✨ Transform tab (mode + scrub time + play/pause). The
// TransformationStage in edit mode drives the runner from this; no second Edit Mode system.
interface TransformationPreviewState {
  timelineId: string | null;
  mode: TransformationMode;
  time: number;
  playing: boolean;
  setTimeline: (id: string | null) => void;
  setMode: (m: TransformationMode) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  scrub: (t: number) => void;
  advance: (dt: number, duration: number) => void;
}

export const useTransformationPreviewStore = create<TransformationPreviewState>((set) => ({
  timelineId: null,
  mode: 'full',
  time: 0,
  playing: false,
  setTimeline: (timelineId) => set({ timelineId, time: 0, playing: false }),
  setMode: (mode) => set({ mode, time: 0 }),
  play: () => set({ playing: true }),
  pause: () => set({ playing: false }),
  stop: () => set({ playing: false, time: 0 }),
  scrub: (time) => set({ time, playing: false }),
  advance: (dt, duration) =>
    set((s) => {
      if (!s.playing) return s;
      const t = s.time + dt;
      return t >= duration ? { time: duration, playing: false } : { time: t };
    }),
}));
