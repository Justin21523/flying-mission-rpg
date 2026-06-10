import { create } from 'zustand';
import type { BoostPadConfig } from '../types/boostPad';
import { BOOST_PAD_SEED } from '../data/poli/boostPathsSeed';
import { editorSpawn } from './sceneEditStore';
import { useWorldSelectStore } from './worldSelectStore';
import { focusCameraOn } from '../game/edit/cameraFocus';

// POLI (Phase B) — BoostPads: pads the player auto-triggers by walking onto them (sensor + per-pad cooldown in
// BoostPadLayer) for a speed burst and/or a PathFollow along a linked path. Distinct from editorBoostStore
// (the boost METER config). Auto-persisted; round-trips via the content registry (domain 'editorBoostPad') and
// is tracked for Undo. Pad drags in Edit Mode write back here via updatePadPosition.
interface EditorBoostPadState {
  pads: BoostPadConfig[];
  addPad: (areaId: string) => string;
  updatePad: (id: string, patch: Partial<BoostPadConfig>) => void;
  updatePadPosition: (id: string, position: [number, number, number]) => void;
  removePad: (id: string) => void;
  importState: (data: { pads?: BoostPadConfig[] }) => void;
  reset: () => void;
}

const STORAGE_KEY = 'r3f-rpg-builder-poli-boostpad-v1';
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

function persist(pads: BoostPadConfig[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ pads })); } catch { /* ignore */ }
}
function load(): BoostPadConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) { const p = JSON.parse(raw); if (Array.isArray(p.pads)) return p.pads; }
  } catch { /* ignore */ }
  return clone(BOOST_PAD_SEED);
}

export const useEditorBoostPadStore = create<EditorBoostPadState>((set, get) => {
  const save = () => persist(get().pads);
  return {
    pads: load(),
    addPad: (areaId) => {
      const id = `pad_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
      const pad: BoostPadConfig = {
        id, enabled: true, boostMode: 'forward', boostSpeed: 16, acceleration: 40, duration: 4, cooldown: 1.5,
        enterPathFollow: false, exitBehavior: 'continueMomentum', areaId,
        position: [Math.round(editorSpawn.x * 100) / 100, 0.3, Math.round(editorSpawn.z * 100) / 100], rotation: [0, 0, 0],
      };
      set({ pads: [...get().pads, pad] }); save();
      const pp = pad.position ?? [0, 0, 0];
      useWorldSelectStore.getState().select(`${id}#pad`); focusCameraOn(pp[0], pp[1], pp[2]);
      return id;
    },
    updatePad: (id, patch) => { set({ pads: get().pads.map((p) => (p.id === id ? { ...p, ...patch } : p)) }); save(); },
    updatePadPosition: (id, position) => { set({ pads: get().pads.map((p) => (p.id === id ? { ...p, position } : p)) }); save(); },
    removePad: (id) => { set({ pads: get().pads.filter((p) => p.id !== id) }); save(); },
    importState: (data) => { set({ pads: Array.isArray(data.pads) ? data.pads : get().pads }); save(); },
    reset: () => { set({ pads: clone(BOOST_PAD_SEED) }); save(); },
  };
});

export function getBoostPads(): BoostPadConfig[] { return useEditorBoostPadStore.getState().pads; }
