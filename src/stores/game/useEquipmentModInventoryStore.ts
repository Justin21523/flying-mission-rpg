import { create } from 'zustand';
import { SEED_EQUIPMENT_MODS } from '../../data/progression/equipmentMods';

// Wave 4/5 — account-wide OWNED equipment mods (vs the per-character EQUIPPED store). Commons are owned by
// default; rarer mods are acquired via drops. Wave 5 — stored as a COUNT map so duplicates accumulate and can
// be fused. Player save-state (persisted via saveStore).
const defaultCommons = (): string[] => SEED_EQUIPMENT_MODS.filter((m) => (m.rarity ?? 'common') === 'common').map((m) => m.id);
const defaultCounts = (): Record<string, number> => Object.fromEntries(defaultCommons().map((id) => [id, 1]));

interface EquipmentModInventoryState {
  ownedCountByModId: Record<string, number>;
  has: (modId: string) => boolean;
  count: (modId: string) => number;
  ownedIds: () => string[]; // mod ids with count > 0
  addMod: (modId: string) => boolean; // increments; true if it became newly owned (0 → 1)
  removeCount: (modId: string, n: number) => boolean; // false (no change) if fewer than n owned
  importState: (data: { ownedCountByModId?: Record<string, number>; ownedModIds?: string[] }) => void;
  reset: () => void;
}

export const useEquipmentModInventoryStore = create<EquipmentModInventoryState>((set, get) => ({
  ownedCountByModId: defaultCounts(),

  has: (modId) => (get().ownedCountByModId[modId] ?? 0) > 0,
  count: (modId) => get().ownedCountByModId[modId] ?? 0,
  ownedIds: () => Object.keys(get().ownedCountByModId).filter((id) => get().ownedCountByModId[id] > 0),

  addMod: (modId) => {
    if (!modId) return false;
    const cur = get().ownedCountByModId[modId] ?? 0;
    set({ ownedCountByModId: { ...get().ownedCountByModId, [modId]: cur + 1 } });
    return cur === 0;
  },

  removeCount: (modId, n) => {
    const cur = get().ownedCountByModId[modId] ?? 0;
    if (n <= 0 || cur < n) return false;
    set({ ownedCountByModId: { ...get().ownedCountByModId, [modId]: cur - n } });
    return true;
  },

  importState: (data) => {
    // Accept the new count map OR the legacy Wave 4 string[] (each → 1). Always keep the default commons owned.
    const counts: Record<string, number> = { ...defaultCounts() };
    if (data.ownedCountByModId && typeof data.ownedCountByModId === 'object') {
      for (const [id, n] of Object.entries(data.ownedCountByModId)) counts[id] = Math.max(counts[id] ?? 0, Math.max(0, Math.floor(n as number)));
    } else if (Array.isArray(data.ownedModIds)) {
      for (const id of data.ownedModIds) counts[id] = Math.max(counts[id] ?? 0, 1);
    }
    set({ ownedCountByModId: counts });
  },

  reset: () => set({ ownedCountByModId: defaultCounts() }),
}));
