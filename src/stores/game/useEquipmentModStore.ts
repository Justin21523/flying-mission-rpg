import { create } from 'zustand';
import { MAX_MODS_PER_CHARACTER } from '../../types/game/equipmentMod';

// Wave 3 — PER-CHARACTER equipped mods (player save-state, mirrors useCharacterProgressionStore). Each
// character holds up to MAX_MODS_PER_CHARACTER mod ids. Persisted via saveStore.
interface EquipmentModState {
  equippedByCharacterId: Record<string, string[]>;
  getEquipped: (characterId: string) => string[];
  setEquipped: (characterId: string, modIds: string[]) => void;
  toggleMod: (characterId: string, modId: string) => void; // equip if absent (and room), else unequip
  importState: (data: { equippedByCharacterId?: Record<string, string[]> }) => void;
  reset: () => void;
}

export const useEquipmentModStore = create<EquipmentModState>((set, get) => ({
  equippedByCharacterId: {},

  getEquipped: (characterId) => get().equippedByCharacterId[characterId] ?? [],

  setEquipped: (characterId, modIds) => {
    if (!characterId) return;
    const next = [...new Set(modIds)].slice(0, MAX_MODS_PER_CHARACTER);
    set({ equippedByCharacterId: { ...get().equippedByCharacterId, [characterId]: next } });
  },

  toggleMod: (characterId, modId) => {
    if (!characterId) return;
    const cur = get().equippedByCharacterId[characterId] ?? [];
    const next = cur.includes(modId)
      ? cur.filter((m) => m !== modId)
      : cur.length < MAX_MODS_PER_CHARACTER ? [...cur, modId] : cur;
    set({ equippedByCharacterId: { ...get().equippedByCharacterId, [characterId]: next } });
  },

  importState: (data) => set({ equippedByCharacterId: data.equippedByCharacterId && typeof data.equippedByCharacterId === 'object' ? data.equippedByCharacterId : {} }),
  reset: () => set({ equippedByCharacterId: {} }),
}));
