import { create } from 'zustand';
import type { CharacterDefinition } from '../types/character';

// POLI — per-character DATA overrides stored in localStorage (model paths, colour, name, etc.).
// Mirrors the editorNpcStore pattern: every mutation auto-persists, load() is tolerant.
// Runtime layers call getMergedPoliCharacter(base) to get the merged definition.
//
// NOTE: spatial transform (position / rotation / scale) is NOT stored here — it lives in the
// kit's core sceneEditStore via objKey(areaId, 'npc', charId), so POLI NPCs reuse the exact
// same Edit Mode pipeline (EditableObject → SceneEditorGizmo → EditModeInspector) as every
// other object in the world. This store only owns non-spatial character data.

export interface CharacterOverride {
  id: string;
  modelRobotPath?: string;
  modelVehiclePath?: string;
  nameZhTW?: string;
  color?: string;
  homeAreaId?: string;
  description?: string;
}

interface EditorPoliCharacterState {
  overrides: Record<string, CharacterOverride>;
  setOverride: (id: string, patch: Partial<CharacterOverride>) => void;
  clearOverride: (id: string) => void;
  reset: () => void;
}

const STORAGE_KEY = 'r3f-rpg-builder-poli-character-v1';

function persist(s: Pick<EditorPoliCharacterState, 'overrides'>): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ overrides: s.overrides })); } catch { /* ignore */ }
}

function load(): { overrides: Record<string, CharacterOverride> } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { overrides: {} };
    const p = JSON.parse(raw) as { overrides?: unknown };
    return { overrides: p.overrides && typeof p.overrides === 'object' ? (p.overrides as Record<string, CharacterOverride>) : {} };
  } catch { return { overrides: {} }; }
}

export const useEditorPoliCharacterStore = create<EditorPoliCharacterState>((set, get) => ({
  ...load(),

  setOverride: (id, patch) => {
    const prev = get().overrides[id] ?? { id };
    const updated = { ...get().overrides, [id]: { ...prev, ...patch, id } };
    set({ overrides: updated });
    persist({ overrides: updated });
  },

  clearOverride: (id) => {
    const updated = { ...get().overrides };
    delete updated[id];
    set({ overrides: updated });
    persist({ overrides: updated });
  },

  reset: () => {
    set({ overrides: {} });
    persist({ overrides: {} });
  },
}));

// Non-hook accessor — safe to call from 3D layers / useFrame / non-component code.
export function getMergedPoliCharacter(base: CharacterDefinition): CharacterDefinition {
  const ov = useEditorPoliCharacterStore.getState().overrides[base.id];
  if (!ov) return base;
  return {
    ...base,
    ...(ov.modelRobotPath !== undefined && { modelRobotPath: ov.modelRobotPath }),
    ...(ov.modelVehiclePath !== undefined && { modelVehiclePath: ov.modelVehiclePath }),
    ...(ov.nameZhTW !== undefined && { nameZhTW: ov.nameZhTW }),
    ...(ov.color !== undefined && { color: ov.color }),
    ...(ov.homeAreaId !== undefined && { homeAreaId: ov.homeAreaId }),
    ...(ov.description !== undefined && { description: ov.description }),
  };
}
