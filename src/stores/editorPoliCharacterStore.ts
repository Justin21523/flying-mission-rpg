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
  canFly?: boolean;
  rotorOffset?: [number, number, number];
  rotorOffsetRobot?: [number, number, number];
  rotorScale?: number;
  abilityName?: string;
  abilityColor?: string;
  abilityType?: import('../types/character').AbilityType;
  abilityRadius?: number;
  abilityDuration?: number;
  abilityStrength?: number;
  abilityCooldownSec?: number;
  superSpeedMult?: number;
  superDurationSec?: number;
  superFlies?: boolean;
  afterimageColor?: string;
  animations?: import('../types/character').AnimRule[];
  vehicleHeight?: number;
  robotHeight?: number;
  modelYOffset?: number;
}

interface EditorPoliCharacterState {
  overrides: Record<string, CharacterOverride>;
  /** Which character is open in the POLI data panel. Pure UI selection (NOT spatial — the
   *  transform gizmo selection still lives in the kit sceneEditStore). Set by clicking the
   *  list, or by clicking the player/NPC in the 3D view. */
  selectedId: string | null;
  setOverride: (id: string, patch: Partial<CharacterOverride>) => void;
  clearOverride: (id: string) => void;
  selectPoli: (id: string | null) => void;
  importState: (data: { overrides?: Record<string, CharacterOverride> }) => void;
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
  selectedId: null,

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

  selectPoli: (id) => set({ selectedId: id }),

  importState: (data) => {
    const overrides = data.overrides && typeof data.overrides === 'object' ? data.overrides : {};
    set({ overrides });
    persist({ overrides });
  },

  reset: () => {
    set({ overrides: {}, selectedId: null });
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
    ...(ov.canFly !== undefined && { canFly: ov.canFly }),
    ...(ov.rotorOffset !== undefined && { rotorOffset: ov.rotorOffset }),
    ...(ov.rotorOffsetRobot !== undefined && { rotorOffsetRobot: ov.rotorOffsetRobot }),
    ...(ov.rotorScale !== undefined && { rotorScale: ov.rotorScale }),
    ...(ov.abilityName !== undefined && { abilityName: ov.abilityName }),
    ...(ov.abilityColor !== undefined && { abilityColor: ov.abilityColor }),
    ...(ov.abilityType !== undefined && { abilityType: ov.abilityType }),
    ...(ov.abilityRadius !== undefined && { abilityRadius: ov.abilityRadius }),
    ...(ov.abilityDuration !== undefined && { abilityDuration: ov.abilityDuration }),
    ...(ov.abilityStrength !== undefined && { abilityStrength: ov.abilityStrength }),
    ...(ov.abilityCooldownSec !== undefined && { abilityCooldownSec: ov.abilityCooldownSec }),
    ...(ov.superSpeedMult !== undefined && { superSpeedMult: ov.superSpeedMult }),
    ...(ov.superDurationSec !== undefined && { superDurationSec: ov.superDurationSec }),
    ...(ov.superFlies !== undefined && { superFlies: ov.superFlies }),
    ...(ov.afterimageColor !== undefined && { afterimageColor: ov.afterimageColor }),
    ...(ov.animations !== undefined && { animations: ov.animations }),
    ...(ov.vehicleHeight !== undefined && { vehicleHeight: ov.vehicleHeight }),
    ...(ov.robotHeight !== undefined && { robotHeight: ov.robotHeight }),
    ...(ov.modelYOffset !== undefined && { modelYOffset: ov.modelYOffset }),
  };
}
