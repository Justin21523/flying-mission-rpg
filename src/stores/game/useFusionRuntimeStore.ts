import { create } from 'zustand';
import type { PartnerFusionDefinition } from '../../types/game/supportCombat';

// Partner Fusion runtime (Batch I) — per-zone charges + per-fusion cooldown + a shared sync gauge (0..100) that
// fills from support/skill use. Mutated only by PartnerFusionDirector; the HUD reads it.
interface FusionEntry { charges: number; cooldownUntil: number; }
interface FusionRuntimeState {
  syncGauge: number;
  gaugeMax: number;
  byId: Record<string, FusionEntry>;
  lastCastFusionId?: string;
  lastCastAtMs?: number;

  initForZone: (fusions: PartnerFusionDefinition[]) => void;
  addSync: (amount: number) => void;
  spend: (fusionId: string, cooldownSeconds: number, nowMs: number) => void;
  reset: () => void;
}

export const useFusionRuntimeStore = create<FusionRuntimeState>((set) => ({
  syncGauge: 0,
  gaugeMax: 100,
  byId: {},

  initForZone: (fusions) => set({
    syncGauge: 0,
    gaugeMax: Math.max(1, ...fusions.map((f) => f.sync.gaugeMax), 100),
    byId: Object.fromEntries(fusions.map((f) => [f.id, { charges: f.chargesPerZone, cooldownUntil: 0 }])),
    lastCastFusionId: undefined, lastCastAtMs: undefined,
  }),

  addSync: (amount) => set((s) => ({ syncGauge: Math.max(0, Math.min(s.gaugeMax, s.syncGauge + amount)) })),

  spend: (fusionId, cooldownSeconds, nowMs) => set((s) => {
    const e = s.byId[fusionId];
    if (!e) return s;
    return {
      byId: { ...s.byId, [fusionId]: { charges: Math.max(0, e.charges - 1), cooldownUntil: nowMs + cooldownSeconds * 1000 } },
      syncGauge: 0,
      lastCastFusionId: fusionId, lastCastAtMs: nowMs,
    };
  }),

  reset: () => set({ syncGauge: 0, byId: {}, lastCastFusionId: undefined, lastCastAtMs: undefined }),
}));

export function fusionEntry(fusionId: string): FusionEntry | undefined {
  return useFusionRuntimeStore.getState().byId[fusionId];
}
