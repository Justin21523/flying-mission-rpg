import { create } from 'zustand';

// POLI yokai-hunt — simple coin wallet (separate from the collectible resourceStore, which fires abilities on
// threshold). Coins are awarded on yokai defeats + hunt wins and shown on the Coins HUD.
interface WalletState {
  coins: number;
  addCoins: (n: number) => void;
  spend: (n: number) => boolean; // deduct if affordable; returns false otherwise
  importState: (data: { coins?: number }) => void;
  reset: () => void;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  coins: 0,
  addCoins: (n) => { if (n > 0) set({ coins: get().coins + n }); },
  spend: (n) => { if (n <= 0) return true; if (get().coins < n) return false; set({ coins: get().coins - n }); return true; },
  importState: (data) => set({ coins: typeof data.coins === 'number' ? Math.max(0, data.coins) : get().coins }),
  reset: () => set({ coins: 0 }),
}));
