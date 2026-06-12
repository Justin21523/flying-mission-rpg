import { create } from 'zustand';
import type { SaveData, SaveProgress, SaveStats, StatKey, SaveSettingsSnapshot, SaveLastSession } from '../types/game/save';
import { createDefaultSave } from '../game/save/SaveDefaults';
import { loadSave, registerSaveProvider, markDirty } from '../game/save/SaveManager';

// Batch 13 — runtime holder of the aero-rescue main save. Single source for progress / stats / settings
// snapshot at runtime; every mutation marks the SaveManager dirty (debounced write). Hydrated once at boot.
// Independent of Edit-Mode editor stores (those keep their own localStorage — never touched here).

interface SaveStoreState {
  save: SaveData;
  hydrated: boolean;
  hydrate: () => void;
  addProgressId: (field: keyof SaveProgress, id: string) => void;
  bumpStat: (key: StatKey, delta?: number) => void;
  setSettingsSnapshot: (snapshot: SaveSettingsSnapshot) => void;
  setLastSession: (patch: Partial<SaveLastSession>) => void;
  setProfile: (patch: Partial<SaveData['playerProfile']>) => void;
  replaceSave: (data: SaveData) => void;
  resetSave: () => void;
}

function commit(set: (p: Partial<SaveStoreState>) => void, save: SaveData): void {
  set({ save });
  markDirty();
}

export const useSaveStore = create<SaveStoreState>((set, get) => ({
  save: createDefaultSave(),
  hydrated: false,

  hydrate: () => {
    const result = loadSave();
    set({ save: result.data, hydrated: true });
    registerSaveProvider(() => get().save);
  },

  addProgressId: (field, id) => {
    const cur = get().save;
    const list = cur.progress[field];
    if (list.includes(id)) return;
    commit(set, { ...cur, progress: { ...cur.progress, [field]: [...list, id] } });
  },

  bumpStat: (key, delta = 1) => {
    const cur = get().save;
    const stats: SaveStats = { ...cur.stats, [key]: cur.stats[key] + delta };
    commit(set, { ...cur, stats });
  },

  setSettingsSnapshot: (snapshot) => {
    commit(set, { ...get().save, settingsSnapshot: snapshot });
  },

  setLastSession: (patch) => {
    const cur = get().save;
    const lastSession: SaveLastSession = { timestamp: new Date().toISOString(), ...cur.lastSession, ...patch };
    commit(set, { ...cur, lastSession });
  },

  setProfile: (patch) => {
    const cur = get().save;
    commit(set, { ...cur, playerProfile: { ...cur.playerProfile, ...patch } });
  },

  replaceSave: (data) => { commit(set, data); },
  resetSave: () => { commit(set, createDefaultSave()); },
}));

export function getSaveData(): SaveData {
  return useSaveStore.getState().save;
}
