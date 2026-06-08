import { create } from 'zustand';
import type { Vec3 } from '../game/edit/sceneEditMerge';

// POLI — per-area landmarks, fully editable in Edit Mode (🗺 Landmarks tab). Each area should have a
// clear landmark; stubs now, models swapped later. localStorage-backed, auto-persist (mirrors the
// other editor stores). Position is also gizmo-movable via LandmarkLayer's EditableObject.
export interface Landmark {
  id: string;
  areaId: string;
  name: string;
  position: Vec3;
  modelAssetId?: string | null; // optional GLB; empty = stub pillar
}

interface EditorLandmarkState {
  landmarks: Landmark[];
  seeded: boolean;
  addLandmark: (areaId: string, position?: Vec3) => string;
  updateLandmark: (id: string, patch: Partial<Landmark>) => void;
  removeLandmark: (id: string) => void;
  markSeeded: (list: Landmark[]) => void;
  reset: () => void;
}

const STORAGE_KEY = 'r3f-rpg-builder-poli-landmark-v1';

function persist(s: Pick<EditorLandmarkState, 'landmarks' | 'seeded'>): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ landmarks: s.landmarks, seeded: s.seeded })); } catch { /* ignore */ }
}

function load(): { landmarks: Landmark[]; seeded: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { landmarks: [], seeded: false };
    const p = JSON.parse(raw) as { landmarks?: Landmark[]; seeded?: boolean };
    return { landmarks: Array.isArray(p.landmarks) ? p.landmarks : [], seeded: !!p.seeded };
  } catch { return { landmarks: [], seeded: false }; }
}

export const useEditorLandmarkStore = create<EditorLandmarkState>((set, get) => ({
  ...load(),

  addLandmark: (areaId, position = [0, 0, 4]) => {
    const id = `lmk_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
    const lm: Landmark = { id, areaId, name: 'New Landmark', position, modelAssetId: null };
    const landmarks = [...get().landmarks, lm];
    set({ landmarks });
    persist({ landmarks, seeded: get().seeded });
    return id;
  },
  updateLandmark: (id, patch) => {
    const landmarks = get().landmarks.map((l) => (l.id === id ? { ...l, ...patch } : l));
    set({ landmarks });
    persist({ landmarks, seeded: get().seeded });
  },
  removeLandmark: (id) => {
    const landmarks = get().landmarks.filter((l) => l.id !== id);
    set({ landmarks });
    persist({ landmarks, seeded: get().seeded });
  },
  markSeeded: (list) => {
    const landmarks = [...get().landmarks, ...list];
    set({ landmarks, seeded: true });
    persist({ landmarks, seeded: true });
  },
  reset: () => { set({ landmarks: [], seeded: false }); persist({ landmarks: [], seeded: false }); },
}));

export function getLandmarksForArea(areaId: string): Landmark[] {
  return useEditorLandmarkStore.getState().landmarks.filter((l) => l.areaId === areaId);
}
