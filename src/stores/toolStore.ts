import { create } from 'zustand';
import { POLI_TOOLS } from '../data/tools/poliTools';
import type { ToolId } from '../types/tool';

interface ActiveBonus {
  actionBonus: number;
  timeBonus: number;
  radiusBonus: number;
}

interface ToolState {
  unlockedTools: ToolId[];
  equippedTools: ToolId[]; // max 3 slots

  initStarterTools: () => void;
  unlockTool: (id: ToolId) => void;
  equipTool: (id: ToolId) => void;
  unequipTool: (id: ToolId) => void;
  isUnlocked: (id: ToolId) => boolean;
  isEquipped: (id: ToolId) => boolean;
  checkLevelUnlocks: (level: number, jinTrust: number) => void;
  getActiveBonus: (incidentId: string) => ActiveBonus;
}

const MAX_EQUIPPED = 3;

export const useToolStore = create<ToolState>((set, get) => ({
  unlockedTools: [],
  equippedTools: [],

  initStarterTools: () => {
    const starters: ToolId[] = ['fire_hose', 'traffic_cone'];
    set({ unlockedTools: starters, equippedTools: starters });
  },

  unlockTool: (id) => {
    if (get().unlockedTools.includes(id)) return;
    set((s) => ({ unlockedTools: [...s.unlockedTools, id] }));
  },

  equipTool: (id) => {
    const s = get();
    if (!s.unlockedTools.includes(id)) return;
    if (s.equippedTools.includes(id)) return;
    if (s.equippedTools.length >= MAX_EQUIPPED) return;
    set((prev) => ({ equippedTools: [...prev.equippedTools, id] }));
  },

  unequipTool: (id) => {
    set((s) => ({ equippedTools: s.equippedTools.filter((t) => t !== id) }));
  },

  isUnlocked: (id) => get().unlockedTools.includes(id),
  isEquipped: (id) => get().equippedTools.includes(id),

  checkLevelUnlocks: (level, jinTrust) => {
    for (const tool of POLI_TOOLS) {
      if (level >= tool.unlockLevel && jinTrust >= tool.unlockTrustWithJin) {
        get().unlockTool(tool.id);
      }
    }
  },

  getActiveBonus: (incidentId) => {
    const bonus: ActiveBonus = { actionBonus: 0, timeBonus: 0, radiusBonus: 0 };
    const { equippedTools } = get();
    for (const id of equippedTools) {
      const def = POLI_TOOLS.find((t) => t.id === id);
      if (!def?.incidentBonus || def.incidentBonus.incidentId !== incidentId) continue;
      bonus.actionBonus += def.incidentBonus.actionBonus ?? 0;
      bonus.timeBonus += def.incidentBonus.timeBonus ?? 0;
      bonus.radiusBonus += def.incidentBonus.radiusBonus ?? 0;
    }
    return bonus;
  },
}));
