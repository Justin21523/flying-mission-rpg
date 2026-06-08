import { create } from 'zustand';
import { getEditorTools, getEditorTool, getToolUpgrade } from './editorToolStore';
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
    // Skill-tree gate: every prerequisite tool must already be unlocked.
    const def = getEditorTool(id);
    const prereqs = def?.prerequisites ?? [];
    if (prereqs.length && !prereqs.every((p) => get().unlockedTools.includes(p as ToolId))) return;
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
    // Several passes so a chain of prerequisites can unlock in one check.
    for (let pass = 0; pass < 4; pass++) {
      for (const tool of getEditorTools()) {
        if (level >= tool.unlockLevel && jinTrust >= tool.unlockTrustWithJin) {
          get().unlockTool(tool.id as ToolId);
        }
      }
    }
  },

  getActiveBonus: (incidentId) => {
    const bonus: ActiveBonus = { actionBonus: 0, timeBonus: 0, radiusBonus: 0 };
    const { equippedTools } = get();
    for (const id of equippedTools) {
      const def = getEditorTool(id);
      if (!def?.incidentBonus || def.incidentBonus.incidentId !== incidentId) continue;
      // Upgrade level scales the bonus: ×(1 + level × upgradeBonusPerLevel).
      const mult = 1 + getToolUpgrade(id) * (def.upgradeBonusPerLevel ?? 0);
      bonus.actionBonus += (def.incidentBonus.actionBonus ?? 0) * mult;
      bonus.timeBonus += (def.incidentBonus.timeBonus ?? 0) * mult;
      bonus.radiusBonus += (def.incidentBonus.radiusBonus ?? 0) * mult;
    }
    return bonus;
  },
}));
