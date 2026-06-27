import { create } from 'zustand';

// Batch L — the player's purchased Hangar upgrade LEVELS (save-state, persisted via saveStore). The
// coin-gated purchase logic lives in HangarBonusResolver; this store is the dumb level map + dev setters.
interface HangarUpgradeState {
  levelByNodeId: Record<string, number>;
  getLevel: (nodeId: string) => number;
  setLevel: (nodeId: string, level: number) => void;
  importState: (data: { levelByNodeId?: Record<string, number> }) => void;
  reset: () => void;
}

export const useHangarUpgradeStore = create<HangarUpgradeState>((set, get) => ({
  levelByNodeId: {},
  getLevel: (nodeId) => get().levelByNodeId[nodeId] ?? 0,
  setLevel: (nodeId, level) => set({ levelByNodeId: { ...get().levelByNodeId, [nodeId]: Math.max(0, level) } }),
  importState: (data) => set({ levelByNodeId: data.levelByNodeId && typeof data.levelByNodeId === 'object' ? data.levelByNodeId : {} }),
  reset: () => set({ levelByNodeId: {} }),
}));
