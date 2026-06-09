import { create } from 'zustand';

// POLI — a minimal vendor shop opened when interacting with a vendor NPC (whose `sells` list is non-empty).
// ShopPanel reads this; buying spends walletStore coins → inventoryStore. No global shop registry needed.
export interface ShopEntry { itemId: string; price: number }

interface ShopState {
  open: boolean;
  title: string;
  items: ShopEntry[];
  openShop: (title: string, items: ShopEntry[]) => void;
  close: () => void;
}

export const useShopStore = create<ShopState>((set) => ({
  open: false,
  title: '',
  items: [],
  openShop: (title, items) => set({ open: true, title, items }),
  close: () => set({ open: false, items: [] }),
}));
