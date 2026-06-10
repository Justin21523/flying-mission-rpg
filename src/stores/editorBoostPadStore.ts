import { create } from 'zustand';
import type { BoostPadConfig } from '../types/boostPad';
import { BOOST_PAD_SEED } from '../data/poli/boostPathsSeed';

// POLI (Phase B) — BoostPads: pads the player auto-triggers by walking onto them (sensor + per-pad cooldown in
// BoostPadLayer) for a speed burst and/or a PathFollow along a linked path. Distinct from editorBoostStore
// (the boost METER config). Auto-persisted; round-trips via the content registry (domain 'editorBoostPad') and
// is tracked for Undo. Pad drags in Edit Mode write back here via updatePadPosition.
interface EditorBoostPadState {
  pads: BoostPadConfig[];
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
    updatePad: (id, patch) => { set({ pads: get().pads.map((p) => (p.id === id ? { ...p, ...patch } : p)) }); save(); },
    updatePadPosition: (id, position) => { set({ pads: get().pads.map((p) => (p.id === id ? { ...p, position } : p)) }); save(); },
    removePad: (id) => { set({ pads: get().pads.filter((p) => p.id !== id) }); save(); },
    importState: (data) => { set({ pads: Array.isArray(data.pads) ? data.pads : get().pads }); save(); },
    reset: () => { set({ pads: clone(BOOST_PAD_SEED) }); save(); },
  };
});

export function getBoostPads(): BoostPadConfig[] { return useEditorBoostPadStore.getState().pads; }
