import { create } from 'zustand';
import type { RuntimeErrorEvent } from '../game/qa/RuntimeErrorCollector';

interface DiagnosticsStore {
  errors: RuntimeErrorEvent[];
  overlayOpen: boolean;
  addError: (event: RuntimeErrorEvent) => void;
  setErrors: (events: RuntimeErrorEvent[]) => void;
  clear: () => void;
  setOverlayOpen: (open: boolean) => void;
}

export const useDiagnosticsStore = create<DiagnosticsStore>((set) => ({
  errors: [],
  overlayOpen: false,
  addError: (event) => set((state) => ({ errors: [event, ...state.errors].slice(0, 50), overlayOpen: true })),
  setErrors: (errors) => set({ errors }),
  clear: () => set({ errors: [], overlayOpen: false }),
  setOverlayOpen: (overlayOpen) => set({ overlayOpen }),
}));
