import { create } from 'zustand';
import { TEXTURE_SETS } from '../game/world/textureLibrary';
import { useEditorEnvironmentStore } from './editorEnvironmentStore';
import { addedForArea, useSceneEditStore } from './sceneEditStore';

// POLI — per-area LAYOUT PRESETS: multiple swappable arrangements of placed models + a paved ground per
// area (🗺 World tab → Layouts). The active preset's pieces are rendered by LayoutLayer (an AreaRenderer
// sibling) via the kit's EditableObject, so each piece is gizmo-movable like any set-piece. Switching a
// preset swaps the rendered pieces and (optionally) re-paves the ground via editorEnvironmentStore.
// Auto-persisted to localStorage.

export type Vec3 = [number, number, number];
export interface LayoutPiece {
  id: string;
  assetId: string; // model-library id (path under models/ w/o extension)
  position: Vec3;
  rotation: Vec3;
  scale: number;
  normalize?: number; // target largest-dimension in world units (size-normalised); folder default if unset
}
export interface LayoutPreset {
  id: string;
  name: string;
  pieces: LayoutPiece[];
  groundTextureKey?: string; // a TEXTURE_SETS id/albedoKey applied on switch (optional)
  groundRepeat?: number;     // tiling for the paved ground
}

interface EditorLayoutState {
  presets: Record<string, LayoutPreset[]>;       // areaId → presets
  activePresetId: Record<string, string>;        // areaId → active preset id
  addPreset: (areaId: string, name?: string) => string;
  duplicatePreset: (areaId: string, presetId: string) => string | null;
  renamePreset: (areaId: string, presetId: string, name: string) => void;
  deletePreset: (areaId: string, presetId: string) => void;
  switchPreset: (areaId: string, presetId: string) => void;
  setPresetGround: (areaId: string, presetId: string, key: string | undefined, repeat?: number) => void;
  addPiece: (areaId: string, assetId: string, position: Vec3) => void;
  updatePiece: (areaId: string, pieceId: string, patch: Partial<LayoutPiece>) => void;
  removePiece: (areaId: string, pieceId: string) => void;
  saveCurrentAsPreset: (areaId: string, name: string) => string;
  importState: (data: { presets?: Record<string, LayoutPreset[]>; activePresetId?: Record<string, string> }) => void;
  reset: () => void;
}

const STORAGE_KEY = 'r3f-rpg-builder-poli-layout-v1';
const uid = (p: string) => `${p}_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;

function persist(s: Pick<EditorLayoutState, 'presets' | 'activePresetId'>): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ presets: s.presets, activePresetId: s.activePresetId })); } catch { /* ignore */ }
}
function load(): Pick<EditorLayoutState, 'presets' | 'activePresetId'> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (p && typeof p === 'object') return { presets: p.presets ?? {}, activePresetId: p.activePresetId ?? {} };
    }
  } catch { /* ignore */ }
  return { presets: {}, activePresetId: {} };
}

// Apply a preset's ground texture to the area via the kit's Environment override (flat PBR plane).
function applyGround(areaId: string, key: string | undefined, repeat?: number): void {
  if (!key) return;
  const set = TEXTURE_SETS.find((x) => x.id === key || x.albedoKey === key);
  if (!set) return;
  useEditorEnvironmentStore.getState().setOverride(areaId, {
    groundType: 'flatPbr',
    pbrGround: {
      albedoUrl: set.albedoKey,
      normalUrl: set.normalKey,
      roughnessUrl: set.roughnessKey,
      aoUrl: set.aoKey,
      repeat: repeat ?? 24,
    },
  });
}

export const useEditorLayoutStore = create<EditorLayoutState>((set, get) => {
  const save = () => persist(get());
  const presetsFor = (areaId: string) => get().presets[areaId] ?? [];
  const writePresets = (areaId: string, list: LayoutPreset[]) => {
    set({ presets: { ...get().presets, [areaId]: list } }); save();
  };
  // Mutate the area's ACTIVE preset (most edits target what's on screen).
  const mutateActive = (areaId: string, fn: (p: LayoutPreset) => LayoutPreset) => {
    const activeId = get().activePresetId[areaId];
    const list = presetsFor(areaId);
    if (!activeId || list.length === 0) return;
    writePresets(areaId, list.map((p) => (p.id === activeId ? fn(p) : p)));
  };

  return {
    ...load(),

    addPreset: (areaId, name) => {
      const id = uid('layout');
      const preset: LayoutPreset = { id, name: name ?? `Layout ${presetsFor(areaId).length + 1}`, pieces: [] };
      const list = [...presetsFor(areaId), preset];
      set({ presets: { ...get().presets, [areaId]: list }, activePresetId: { ...get().activePresetId, [areaId]: id } });
      save();
      return id;
    },
    duplicatePreset: (areaId, presetId) => {
      const src = presetsFor(areaId).find((p) => p.id === presetId);
      if (!src) return null;
      const id = uid('layout');
      const copy: LayoutPreset = { ...src, id, name: `${src.name} (copy)`, pieces: src.pieces.map((pc) => ({ ...pc, id: uid('pc') })) };
      writePresets(areaId, [...presetsFor(areaId), copy]);
      return id;
    },
    renamePreset: (areaId, presetId, name) => writePresets(areaId, presetsFor(areaId).map((p) => (p.id === presetId ? { ...p, name } : p))),
    deletePreset: (areaId, presetId) => {
      const list = presetsFor(areaId).filter((p) => p.id !== presetId);
      const active = get().activePresetId[areaId] === presetId ? list[0]?.id : get().activePresetId[areaId];
      set({ presets: { ...get().presets, [areaId]: list }, activePresetId: { ...get().activePresetId, [areaId]: active ?? '' } });
      save();
    },
    switchPreset: (areaId, presetId) => {
      const preset = presetsFor(areaId).find((p) => p.id === presetId);
      set({ activePresetId: { ...get().activePresetId, [areaId]: presetId } });
      save();
      if (preset) applyGround(areaId, preset.groundTextureKey, preset.groundRepeat);
    },
    setPresetGround: (areaId, presetId, key, repeat) => {
      writePresets(areaId, presetsFor(areaId).map((p) => (p.id === presetId ? { ...p, groundTextureKey: key, groundRepeat: repeat } : p)));
      if (get().activePresetId[areaId] === presetId) applyGround(areaId, key, repeat);
    },
    addPiece: (areaId, assetId, position) =>
      mutateActive(areaId, (p) => ({ ...p, pieces: [...p.pieces, { id: uid('pc'), assetId, position, rotation: [0, 0, 0], scale: 1 }] })),
    updatePiece: (areaId, pieceId, patch) =>
      mutateActive(areaId, (p) => ({ ...p, pieces: p.pieces.map((pc) => (pc.id === pieceId ? { ...pc, ...patch } : pc)) })),
    removePiece: (areaId, pieceId) =>
      mutateActive(areaId, (p) => ({ ...p, pieces: p.pieces.filter((pc) => pc.id !== pieceId) })),

    saveCurrentAsPreset: (areaId, name) => {
      // Snapshot the active layout's pieces + any kit "Add Model" set-pieces placed in this area.
      const active = presetsFor(areaId).find((p) => p.id === get().activePresetId[areaId]);
      const fromLayout = active?.pieces ?? [];
      const fromKit = addedForArea(areaId, useSceneEditStore.getState().added).map((a) => ({
        id: uid('pc'), assetId: a.assetId, position: a.position, rotation: a.rotation, scale: a.scale,
      } as LayoutPiece));
      const id = uid('layout');
      const preset: LayoutPreset = {
        id, name,
        pieces: [...fromLayout.map((pc) => ({ ...pc, id: uid('pc') })), ...fromKit],
        groundTextureKey: active?.groundTextureKey,
        groundRepeat: active?.groundRepeat,
      };
      set({ presets: { ...get().presets, [areaId]: [...presetsFor(areaId), preset] }, activePresetId: { ...get().activePresetId, [areaId]: id } });
      save();
      return id;
    },

    importState: (data) => {
      set({ presets: data.presets ?? get().presets, activePresetId: data.activePresetId ?? get().activePresetId });
      save();
    },
    reset: () => { set({ presets: {}, activePresetId: {} }); save(); },
  };
});

export function getActiveLayoutPieces(areaId: string): LayoutPiece[] {
  const s = useEditorLayoutStore.getState();
  const activeId = s.activePresetId[areaId];
  const list = s.presets[areaId] ?? [];
  const active = list.find((p) => p.id === activeId) ?? list[0];
  return active?.pieces ?? [];
}
