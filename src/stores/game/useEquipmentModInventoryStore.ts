import { create } from 'zustand';
import { SEED_EQUIPMENT_MODS } from '../../data/progression/equipmentMods';

// Wave 4 — account-wide OWNED equipment mods (vs the per-character EQUIPPED store). Commons are owned by
// default; rarer mods are acquired via drops. Player save-state (persisted via saveStore).
const defaultOwned = (): string[] => SEED_EQUIPMENT_MODS.filter((m) => (m.rarity ?? 'common') === 'common').map((m) => m.id);

interface EquipmentModInventoryState {
  ownedModIds: string[];
  has: (modId: string) => boolean;
  addMod: (modId: string) => boolean; // true if newly added
  importState: (data: { ownedModIds?: string[] }) => void;
  reset: () => void;
}

export const useEquipmentModInventoryStore = create<EquipmentModInventoryState>((set, get) => ({
  ownedModIds: defaultOwned(),
  has: (modId) => get().ownedModIds.includes(modId),
  addMod: (modId) => { if (!modId || get().ownedModIds.includes(modId)) return false; set({ ownedModIds: [...get().ownedModIds, modId] }); return true; },
  importState: (data) => {
    const owned = Array.isArray(data.ownedModIds) ? data.ownedModIds : [];
    // Always keep the default commons owned so the equip UI is never empty after a restore.
    set({ ownedModIds: [...new Set([...defaultOwned(), ...owned])] });
  },
  reset: () => set({ ownedModIds: defaultOwned() }),
}));
