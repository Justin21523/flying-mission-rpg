import { create } from 'zustand';

export type WorldFlightEditViewMode = 'clean-edit' | 'preview-edit' | 'play-like-edit';

interface WorldFlightEditorState {
  editViewMode: WorldFlightEditViewMode;
  setEditViewMode: (mode: WorldFlightEditViewMode) => void;
}

const STORAGE_KEY = 'aero-rescue-world-flight-editor-v1';
const MODES: readonly WorldFlightEditViewMode[] = ['clean-edit', 'preview-edit', 'play-like-edit'];

function loadMode(): WorldFlightEditViewMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return MODES.includes(raw as WorldFlightEditViewMode) ? raw as WorldFlightEditViewMode : 'clean-edit';
  } catch {
    return 'clean-edit';
  }
}

function persist(mode: WorldFlightEditViewMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* ignore unavailable storage */
  }
}

export const useWorldFlightEditorStore = create<WorldFlightEditorState>((set) => ({
  editViewMode: loadMode(),
  setEditViewMode: (editViewMode) => {
    set({ editViewMode });
    persist(editViewMode);
  },
}));
