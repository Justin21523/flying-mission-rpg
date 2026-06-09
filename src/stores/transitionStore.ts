import { create } from 'zustand';

// POLI — a quick screen-fade used for walk-between-areas transitions. begin(midFn) fades to black, runs
// midFn (the actual area travel) while covered, then fades back. ScreenFade renders the overlay.
interface TransitionState {
  covering: boolean;
  begin: (midFn: () => void) => void;
}

const FADE_MS = 200;   // fade-to-black duration
const HOLD_MS = 220;   // total time before uncovering (travel happens at FADE_MS)

export const useTransitionStore = create<TransitionState>((set, get) => ({
  covering: false,
  begin: (midFn) => {
    if (get().covering) return; // already mid-transition
    set({ covering: true });
    window.setTimeout(() => { try { midFn(); } catch { /* ignore */ } }, FADE_MS);
    window.setTimeout(() => set({ covering: false }), FADE_MS + HOLD_MS);
  },
}));
