import { create } from 'zustand';

// POLI — a quick screen-fade used for walk-between-areas transitions. begin(midFn, label) fades to black
// (showing the destination name), runs midFn (the area travel) while covered, then fades back. ScreenFade
// renders the overlay.
interface TransitionState {
  covering: boolean;
  label: string;
  begin: (midFn: () => void, label?: string) => void;
}

const FADE_MS = 320;   // fade-to-black duration (matches ScreenFade CSS)
const HOLD_MS = 360;   // extra time held black before uncovering (travel happens at FADE_MS)

export const useTransitionStore = create<TransitionState>((set, get) => ({
  covering: false,
  label: '',
  begin: (midFn, label = '') => {
    if (get().covering) return; // already mid-transition
    set({ covering: true, label });
    window.setTimeout(() => { try { midFn(); } catch { /* ignore */ } }, FADE_MS);
    window.setTimeout(() => set({ covering: false }), FADE_MS + HOLD_MS);
  },
}));
