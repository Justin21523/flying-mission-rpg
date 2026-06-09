import { create } from 'zustand';
import { getItem } from '../data/items';
import type { ItemUseEffect } from '../types/item';
import { useWalletStore } from './walletStore';
import { useProgressionStore } from './progressionStore';
import { useFlagStore } from './flagStore';
import { useBoostStore } from './boostStore';

// Apply a consumable item's on-use effect (coins / exp / world flag / boost-meter heal).
function applyItemUseEffect(eff?: ItemUseEffect): void {
  if (!eff || eff.kind === 'none') return;
  const amt = eff.amount ?? 0;
  if (eff.kind === 'coins') useWalletStore.getState().addCoins(amt || 1);
  else if (eff.kind === 'exp') useProgressionStore.getState().addExp(amt || 1);
  else if (eff.kind === 'flag' && eff.flag) useFlagStore.getState().setFlag(eff.flag);
  else if (eff.kind === 'heal') useBoostStore.getState().addMeter(amt || 25);
}

// Kit — itemId → quantity inventory, plus a set of world item ids that have been picked up (so the
// world layer can stop rendering them). Generic; the yokai quest-tracker hook was removed.
interface InventoryState {
  items: Record<string, number>;
  pickedUpItems: string[];
  setInventory: (items: Record<string, number>) => void;
  setPickedUpItems: (itemIds: string[]) => void;
  addItem: (id: string, quantity?: number) => void;
  markPickedUp: (id: string) => void;
  removeItem: (id: string, quantity?: number) => void;
  useItem: (id: string) => boolean;
  hasItem: (id: string) => boolean;
  isPickedUp: (id: string) => boolean;
  getItemQuantity: (id: string) => number;
  reset: () => void;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  items: {},
  pickedUpItems: [],

  setInventory: (items) => set({ items }),
  setPickedUpItems: (itemIds) => set({ pickedUpItems: [...new Set(itemIds)] }),

  addItem: (id, quantity = 1) =>
    set((state) => ({ items: { ...state.items, [id]: (state.items[id] || 0) + quantity } })),

  markPickedUp: (id) =>
    set((state) =>
      state.pickedUpItems.includes(id) ? state : { pickedUpItems: [...state.pickedUpItems, id] },
    ),

  removeItem: (id, quantity = 1) =>
    set((state) => {
      const newQty = Math.max(0, (state.items[id] || 0) - quantity);
      const items = { ...state.items };
      if (newQty === 0) delete items[id];
      else items[id] = newQty;
      return { items };
    }),

  useItem: (id) => {
    const item = getItem(id);
    if (!item || !item.consumable) return false;
    if (get().getItemQuantity(id) > 0) {
      get().removeItem(id, 1);
      applyItemUseEffect(item.useEffect);
      return true;
    }
    return false;
  },

  hasItem: (id) => (get().items[id] || 0) > 0,
  isPickedUp: (id) => get().pickedUpItems.includes(id),
  getItemQuantity: (id) => get().items[id] || 0,
  reset: () => set({ items: {}, pickedUpItems: [] }),
}));
