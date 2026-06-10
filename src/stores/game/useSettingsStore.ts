import { create } from 'zustand';
import type { GameSettings } from '../../types/game/settings';
import { DEFAULT_SETTINGS } from '../../data/game/settings';

const STORAGE_KEY = 'aero-rescue-settings-v1';

function persist(settings: GameSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* ignore localStorage quota / unavailable */
  }
}

function load(): GameSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const p: unknown = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...(p && typeof p === 'object' ? (p as Partial<GameSettings>) : {}) };
  } catch {
    return { ...DEFAULT_SETTINGS }; // corrupt entry → defaults
  }
}

interface SettingsStore {
  settings: GameSettings;
  update: (patch: Partial<GameSettings>) => void;
  importState: (data: { settings?: Partial<GameSettings> }) => void;
  reset: () => void;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: load(),
  update: (patch) => {
    const settings = { ...get().settings, ...patch };
    set({ settings });
    persist(settings);
  },
  importState: (data) => {
    const settings = { ...DEFAULT_SETTINGS, ...(data.settings ?? {}) };
    set({ settings });
    persist(settings);
  },
  reset: () => {
    set({ settings: { ...DEFAULT_SETTINGS } });
    persist({ ...DEFAULT_SETTINGS });
  },
}));

export function getGameSettings(): GameSettings {
  return useSettingsStore.getState().settings;
}
