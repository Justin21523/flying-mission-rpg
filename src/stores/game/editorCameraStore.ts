import { create } from 'zustand';
import type { GamePhase } from '../../types/game/state';
import type { PhaseCameraConfig } from '../../types/game/cameraConfig';

// Per-phase authored follow-camera framing (🎥 Camera tab). localStorage-backed; an empty map = the built-in
// FollowCamera defaults (back-compat). Registered for project export/import + Undo via editorContentRegistry.
const STORAGE_KEY = 'aero-rescue-editor-camera-v1';
type CamMap = Partial<Record<GamePhase, PhaseCameraConfig>>;

function persist(byPhase: CamMap): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ byPhase })); } catch { /* ignore */ }
}
function load(): CamMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) { const p = JSON.parse(raw); if (p && typeof p === 'object' && p.byPhase) return p.byPhase as CamMap; }
  } catch { /* ignore */ }
  return {};
}

interface EditorCameraState {
  byPhase: CamMap;
  editingPhase: GamePhase | null; // the phase whose orbit-gizmo camera proxy is shown (🎮 in the Camera tab)
  setPhase: (phase: GamePhase, cfg: PhaseCameraConfig) => void;
  clearPhase: (phase: GamePhase) => void;
  setEditingPhase: (phase: GamePhase | null) => void;
  importState: (data: { byPhase?: CamMap }) => void;
  reset: () => void;
}

export const useEditorCameraStore = create<EditorCameraState>((set, get) => ({
  byPhase: load(),
  editingPhase: null,
  setPhase: (phase, cfg) => { const byPhase = { ...get().byPhase, [phase]: cfg }; set({ byPhase }); persist(byPhase); },
  clearPhase: (phase) => { const byPhase = { ...get().byPhase }; delete byPhase[phase]; set({ byPhase }); persist(byPhase); },
  setEditingPhase: (editingPhase) => set({ editingPhase }), // transient (not persisted/exported)
  importState: (data) => { const byPhase = (data.byPhase && typeof data.byPhase === 'object') ? data.byPhase : {}; set({ byPhase }); persist(byPhase); },
  reset: () => { set({ byPhase: {} }); persist({}); },
}));

// Non-hook accessor for the 3D camera layer (FollowCamera) — no per-frame React subscription.
export function getPhaseCamera(phase: GamePhase): PhaseCameraConfig | undefined {
  return useEditorCameraStore.getState().byPhase[phase];
}
