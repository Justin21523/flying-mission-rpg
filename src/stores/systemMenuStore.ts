import { create } from 'zustand';
import { setPaused } from '../game/performance/SceneVisibilityController';

// In-game system menu (aero play mode): pause overlay + Settings + Save entry points. Opening soft-pauses
// the game via SceneVisibilityController (freezes non-essential ticks + audio, without changing the game
// phase / swapping scenes); closing resumes. Separate from Edit Mode and the dev panels.
export type SystemMenuView = 'root' | 'settings' | 'save';

interface SystemMenuState {
  open: boolean;
  view: SystemMenuView;
  openMenu: () => void;
  closeMenu: () => void;
  toggle: () => void;
  setView: (v: SystemMenuView) => void;
}

export const useSystemMenuStore = create<SystemMenuState>((set, get) => ({
  open: false,
  view: 'root',
  openMenu: () => { if (!get().open) { set({ open: true, view: 'root' }); setPaused(true); } },
  closeMenu: () => { if (get().open) { set({ open: false }); setPaused(false); } },
  toggle: () => (get().open ? get().closeMenu() : get().openMenu()),
  setView: (view) => set({ view }),
}));
