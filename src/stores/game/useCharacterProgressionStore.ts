import { create } from 'zustand';

// Batch L (meta-progression) — PER-CHARACTER level + experience. Each character accrues its own EXP from
// defeating enemies; levels grant skill points (see SkillUpgradeResolver). Persisted via saveStore (not an
// editor collection — this is player save-state, reachable in dev via the Upgrades panel's dev controls).
// Level curve mirrors progressionStore: each level needs level*100 EXP.
const expForLevel = (level: number): number => level * 100;

export interface CharacterProgressEntry { level: number; exp: number }

interface CharacterProgressionState {
  byId: Record<string, CharacterProgressEntry>;
  addExp: (characterId: string, amount: number) => void;
  grantLevels: (characterId: string, n: number) => void; // dev
  getEntry: (characterId: string) => CharacterProgressEntry;
  importState: (data: { byId?: Record<string, CharacterProgressEntry> }) => void;
  reset: () => void;
}

const DEFAULT: CharacterProgressEntry = { level: 1, exp: 0 };

function level(entry: CharacterProgressEntry): CharacterProgressEntry {
  let { level, exp } = entry;
  while (exp >= expForLevel(level)) { exp -= expForLevel(level); level += 1; }
  return { level, exp };
}

export const useCharacterProgressionStore = create<CharacterProgressionState>((set, get) => ({
  byId: {},

  addExp: (characterId, amount) => {
    if (!characterId || amount <= 0) return;
    const cur = get().byId[characterId] ?? DEFAULT;
    set({ byId: { ...get().byId, [characterId]: level({ level: cur.level, exp: cur.exp + amount }) } });
  },

  grantLevels: (characterId, n) => {
    if (!characterId || n <= 0) return;
    const cur = get().byId[characterId] ?? DEFAULT;
    set({ byId: { ...get().byId, [characterId]: { level: cur.level + n, exp: cur.exp } } });
  },

  getEntry: (characterId) => get().byId[characterId] ?? DEFAULT,

  importState: (data) => set({ byId: data.byId && typeof data.byId === 'object' ? data.byId : {} }),
  reset: () => set({ byId: {} }),
}));

export const expToNextLevel = (entry: CharacterProgressEntry): number => expForLevel(entry.level);
