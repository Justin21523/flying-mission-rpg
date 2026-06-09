import { create } from 'zustand';
import { useSceneEditStore } from './sceneEditStore';

// Kit — the single "selected editor world placement" shared by all DataBackedPlacement objects (activity
// participants / arena points, encounter markers, quest markers, crosswalks, incident markers). Unlike
// sceneEditStore (which stores gizmo *overrides*), these placements write their moves straight back into
// their owning data store. One selection at a time; clicking a placement or pressing 📍/🎯 selects it;
// Escape (App) clears it. Selecting here CLEARS the kit's sceneEditStore selection so only one gizmo is
// ever active — the two selection systems are mutually exclusive (fixes "gizmo won't switch objects").
interface WorldSelectState {
  selectedKey: string | null;
  select: (key: string | null) => void;
}

export const useWorldSelectStore = create<WorldSelectState>((set) => ({
  selectedKey: null,
  select: (key) => { if (key) useSceneEditStore.getState().clearSelection(); set({ selectedKey: key }); },
}));
