import { create } from 'zustand';

// Dev/debug-only store (not gameplay state). Drives the Leva dev panel.
//
// `sceneMode` selects what the single <Canvas> renders:
//   - 'greybox' — the Batch 0 engineering base: ground + lights + test cubes + orbit camera.
//   - 'world'   — the inherited POLI kit world (kept on disk, dormant by default). It will be
//                 progressively replaced by the flight / transformation FSM in later batches.
// Default is 'greybox' so a fresh checkout boots straight into the new game's base scene.
export type SceneMode = 'greybox' | 'world';

interface DevState {
  sceneMode: SceneMode;
  setSceneMode: (mode: SceneMode) => void;
}

export const useDevStore = create<DevState>((set) => ({
  sceneMode: 'greybox',
  setSceneMode: (sceneMode) => set({ sceneMode }),
}));
