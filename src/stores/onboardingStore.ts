import { create } from 'zustand';

// POLI (K4d) — a tiny first-run tutorial: move → interact → open the map → start a rescue. Persists a "seen"
// flag so it only shows once; the ⚙ Settings panel can replay it. The HUD (OnboardingHud) advances the step by
// observing the player's actions.
export type OnboardingStep = 'move' | 'interact' | 'map' | 'rescue' | 'done';
const ORDER: OnboardingStep[] = ['move', 'interact', 'map', 'rescue', 'done'];
const STORAGE_KEY = 'r3f-rpg-builder-poli-onboarding-v1';

function loadSeen(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch { return false; }
}

interface OnboardingState {
  seen: boolean;
  step: OnboardingStep;
  advanceTo: (s: OnboardingStep) => void; // move forward only (never backwards)
  dismiss: () => void;
  replay: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  seen: loadSeen(),
  step: loadSeen() ? 'done' : 'move',
  advanceTo: (s) => {
    if (ORDER.indexOf(s) <= ORDER.indexOf(get().step)) return; // forward-only
    if (s === 'done') { try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* ignore */ } set({ step: 'done', seen: true }); }
    else set({ step: s });
  },
  dismiss: () => { try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* ignore */ } set({ step: 'done', seen: true }); },
  replay: () => { try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ } set({ step: 'move', seen: false }); },
}));
