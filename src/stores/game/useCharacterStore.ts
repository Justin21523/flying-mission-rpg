import { create } from 'zustand';
import type { SupportMember } from '../../types/game/support';
import { gameEventBus } from '../../game/core/EventBus';

// Runtime character selection + support roster. The authored roster lives in editorCharacterStore;
// this only tracks who is selected / called in.
interface CharacterStore {
  selectedCharacterId: string | null;
  support: SupportMember[];
  selectCharacter: (id: string | null) => void;
  addSupport: (member: SupportMember) => void;
  removeSupport: (characterId: string) => void;
  clearSupport: () => void;
  reset: () => void;
}

export const useCharacterStore = create<CharacterStore>((set, get) => ({
  selectedCharacterId: null,
  support: [],

  selectCharacter: (id) => {
    set({ selectedCharacterId: id });
    if (id) gameEventBus.emit('character:selected', { characterId: id });
  },

  addSupport: (member) => {
    if (get().support.some((m) => m.characterId === member.characterId)) return;
    set({ support: [...get().support, member] });
  },

  removeSupport: (characterId) => set({ support: get().support.filter((m) => m.characterId !== characterId) }),
  clearSupport: () => set({ support: [] }),
  reset: () => set({ selectedCharacterId: null, support: [] }),
}));
