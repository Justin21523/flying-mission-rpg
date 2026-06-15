import { create } from 'zustand';

// Character-kit runtime state (Batch D-kits): the active kit, per-character combo buffer, unlocks, and debug
// flags. The kit director writes; UI reads. Skill casting + cooldown/energy still live in the combat stores.

export interface ComboCast { skillId: string; t: number }

interface CharacterSkillState {
  activeCharacterId?: string;
  activeKitId?: string;
  comboStateByCharacterId: Record<string, { recentCasts: ComboCast[]; lastComboTriggeredId?: string; lastComboAt?: number }>;
  unlockedSkillIds: string[];
  debug: { unlockAllSkills: boolean; ignoreSkillRequirements: boolean; showSkillSockets: boolean; showSkillRangePreview: boolean };

  setActiveKit: (characterId: string, kitId: string) => void;
  recordCast: (characterId: string, skillId: string, t: number) => void;
  setComboTriggered: (characterId: string, comboId: string, t: number) => void;
  setDebugFlag: (flag: keyof CharacterSkillState['debug'], value: boolean) => void;
  resetCharacterSkills: () => void;
}

const CAST_BUFFER = 6;

export const useCharacterSkillStore = create<CharacterSkillState>((set) => ({
  activeCharacterId: undefined,
  activeKitId: undefined,
  comboStateByCharacterId: {},
  unlockedSkillIds: [],
  debug: { unlockAllSkills: false, ignoreSkillRequirements: false, showSkillSockets: false, showSkillRangePreview: false },

  setActiveKit: (characterId, kitId) => set({ activeCharacterId: characterId, activeKitId: kitId }),

  recordCast: (characterId, skillId, t) =>
    set((s) => {
      const cur = s.comboStateByCharacterId[characterId] ?? { recentCasts: [] };
      const recentCasts = [...cur.recentCasts, { skillId, t }].slice(-CAST_BUFFER);
      return { comboStateByCharacterId: { ...s.comboStateByCharacterId, [characterId]: { ...cur, recentCasts } } };
    }),

  setComboTriggered: (characterId, comboId, t) =>
    set((s) => {
      const cur = s.comboStateByCharacterId[characterId] ?? { recentCasts: [] };
      return { comboStateByCharacterId: { ...s.comboStateByCharacterId, [characterId]: { ...cur, lastComboTriggeredId: comboId, lastComboAt: t } } };
    }),

  setDebugFlag: (flag, value) => set((s) => ({ debug: { ...s.debug, [flag]: value } })),

  resetCharacterSkills: () => set({ comboStateByCharacterId: {}, activeCharacterId: undefined, activeKitId: undefined }),
}));
