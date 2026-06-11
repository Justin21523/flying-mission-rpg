import { create } from 'zustand';
import { useSceneEditStore } from './sceneEditStore';

// Kit — the single "selected editor world placement" shared by all DataBackedPlacement objects (activity
// participants / arena points, encounter markers, quest markers, crosswalks, incident markers). Unlike
// sceneEditStore (which stores gizmo *overrides*), these placements write their moves straight back into
// their owning data store. One selection at a time; clicking a placement or pressing 📍/🎯 selects it;
// Escape (App) clears it. Selecting here CLEARS the kit's sceneEditStore selection so only one gizmo is
// ever active — the two selection systems are mutually exclusive (fixes "gizmo won't switch objects").
interface WorldSelectState {
  selectedKey: string | null; // primary (the one the gizmo attaches to)
  extraKeys: string[]; // additionally selected placements (Shift/Ctrl-click) — moved together with the primary
  onDelete: (() => void) | null; // how to remove the selected placement (Delete key / inspector)
  select: (key: string | null, onDelete?: (() => void) | null) => void;
  toggle: (key: string, onDelete?: (() => void) | null) => void; // Shift/Ctrl-click: add/remove from the set
  isSelected: (key: string) => boolean;
}

export const useWorldSelectStore = create<WorldSelectState>((set, get) => ({
  selectedKey: null,
  extraKeys: [],
  onDelete: null,
  // Single-select: replaces the whole selection (primary + extras cleared).
  select: (key, onDelete = null) => {
    if (key) useSceneEditStore.getState().clearSelection();
    set({ selectedKey: key, extraKeys: [], onDelete: key ? onDelete : null });
  },
  // Multi-select. No primary yet → become primary. Clicking the primary → drop it (promote an extra). An
  // extra → remove it. Otherwise → add as an extra. Keeps the kit's mutual-exclusion with sceneEditStore.
  toggle: (key, onDelete = null) => {
    useSceneEditStore.getState().clearSelection();
    const { selectedKey, extraKeys } = get();
    if (selectedKey === null) { set({ selectedKey: key, extraKeys: [], onDelete }); return; }
    if (key === selectedKey) {
      const [next, ...rest] = extraKeys;
      set({ selectedKey: next ?? null, extraKeys: rest, onDelete: null });
      return;
    }
    if (extraKeys.includes(key)) { set({ extraKeys: extraKeys.filter((k) => k !== key) }); return; }
    set({ extraKeys: [...extraKeys, key] });
  },
  isSelected: (key) => { const s = get(); return s.selectedKey === key || s.extraKeys.includes(key); },
}));
