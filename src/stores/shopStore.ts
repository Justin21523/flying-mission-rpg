import { create } from 'zustand';

// POLI — a minimal vendor shop opened when interacting with a vendor NPC (whose `sells` list is non-empty).
// ShopPanel reads this; buying spends walletStore coins → inventoryStore. No global shop registry needed.
export interface ShopEntry { itemId: string; price: number }

interface ShopState {
  open: boolean;
  title: string;
  items: ShopEntry[];
  vendorId: string | null; // the vendor NPC id — drives a trust-based discount (relationshipStore)
  openShop: (title: string, items: ShopEntry[], vendorId?: string) => void;
  close: () => void;
}

export const useShopStore = create<ShopState>((set) => ({
  open: false,
  title: '',
  items: [],
  vendorId: null,
  openShop: (title, items, vendorId) => set({ open: true, title, items, vendorId: vendorId ?? null }),
  close: () => set({ open: false, items: [], vendorId: null }),
}));
