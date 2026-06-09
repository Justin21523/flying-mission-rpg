import { create } from 'zustand';

export type RelationshipTier = 'stranger' | 'acquaintance' | 'friend' | 'trusted';

interface RelationshipState {
  trust: Record<string, number>;
  getTrust: (id: string) => number;
  getRelationshipTier: (id: string) => RelationshipTier;
  increaseTrust: (id: string, amount: number) => void;
  decreaseTrust: (id: string, amount: number) => void;
  importState: (data: { trust?: Record<string, number> }) => void;
  reset: () => void;
}

export const useRelationshipStore = create<RelationshipState>((set, get) => ({
  trust: {},
  getTrust: (id) => get().trust[id] ?? 0,
  getRelationshipTier: (id) => {
    const t = get().trust[id] ?? 0;
    if (t >= 81) return 'trusted';
    if (t >= 51) return 'friend';
    if (t >= 21) return 'acquaintance';
    return 'stranger';
  },
  increaseTrust: (id, amount) =>
    set((s) => ({ trust: { ...s.trust, [id]: Math.min(100, (s.trust[id] ?? 0) + amount) } })),
  decreaseTrust: (id, amount) =>
    set((s) => ({ trust: { ...s.trust, [id]: Math.max(0, (s.trust[id] ?? 0) - amount) } })),
  importState: (data) => set({ trust: data.trust && typeof data.trust === 'object' ? { ...data.trust } : get().trust }),
  reset: () => set({ trust: {} }),
}));
