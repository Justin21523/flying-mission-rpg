import { create } from 'zustand';

// Batch L (meta-progression) — per-skill upgrade LEVEL (0 = base). The gating math (skill points available,
// cumulative cost, max level) lives in SkillUpgradeResolver; this store is the dumb persistent level map
// (saved via saveStore). setLevel is used by the resolver's validated upgrade + dev controls.
interface SkillUpgradeState {
  levelBySkillId: Record<string, number>;
  getLevel: (skillId: string) => number;
  setLevel: (skillId: string, level: number) => void;
  importState: (data: { levelBySkillId?: Record<string, number> }) => void;
  reset: () => void;
}

export const useSkillUpgradeStore = create<SkillUpgradeState>((set, get) => ({
  levelBySkillId: {},
  getLevel: (skillId) => get().levelBySkillId[skillId] ?? 0,
  setLevel: (skillId, level) => set({ levelBySkillId: { ...get().levelBySkillId, [skillId]: Math.max(0, level) } }),
  importState: (data) => set({ levelBySkillId: data.levelBySkillId && typeof data.levelBySkillId === 'object' ? data.levelBySkillId : {} }),
  reset: () => set({ levelBySkillId: {} }),
}));
