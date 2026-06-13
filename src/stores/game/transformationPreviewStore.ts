import { create } from 'zustand';
import type { TransformationMode } from '../../types/game/transformation';

// Edit-Mode preview controls for the ✨ Transform tab (mode + scrub time + play/pause). The
// TransformationStage in edit mode drives the runner from this; no second Edit Mode system.
interface TransformationPreviewState {
  timelineId: string | null;
  mode: TransformationMode;
  time: number;
  playing: boolean;
  rangeEnd: number | null;
  previewCamera: boolean;
  setTimeline: (id: string | null) => void;
  setMode: (m: TransformationMode) => void;
  setPreviewCamera: (enabled: boolean) => void;
  play: () => void;
  playRange: (start: number, end: number, previewCamera?: boolean) => void;
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
  rangeEnd: null,
  previewCamera: false,
  setTimeline: (timelineId) => set({ timelineId, time: 0, playing: false, rangeEnd: null }),
  setMode: (mode) => set({ mode, time: 0, rangeEnd: null }),
  setPreviewCamera: (previewCamera) => set({ previewCamera }),
  play: () => set({ playing: true, rangeEnd: null }),
  playRange: (start, end, previewCamera = true) => set({ time: Math.max(0, start), playing: true, rangeEnd: Math.max(start, end), previewCamera }),
  pause: () => set({ playing: false, rangeEnd: null }),
  stop: () => set({ playing: false, time: 0, rangeEnd: null }),
  scrub: (time) => set({ time, playing: false, rangeEnd: null }),
  advance: (dt, duration) =>
    set((s) => {
      if (!s.playing) return s;
      const t = s.time + dt;
      const end = Math.min(duration, s.rangeEnd ?? duration);
      return t >= end ? { time: end, playing: false, rangeEnd: null } : { time: t };
    }),
}));
