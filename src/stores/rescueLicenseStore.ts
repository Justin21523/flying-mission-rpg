import { create } from 'zustand';
import { LICENSE_TIERS } from '../data/progression/licenseTiers';
import type { LicenseTier } from '../data/progression/licenseTiers';
import { useProgressionStore } from './progressionStore';

// POLI — rescue-license progression. `rescuesCompleted` rises as the player finishes rescues (incremented
// from rescueOperationStore.dismissDebrief). Tiers are editable in the 🎖 License tab. getCurrentTier()
// returns the highest tier whose requirements are met. Auto-persisted.
interface RescueLicenseState {
  rescuesCompleted: number;
  tiers: LicenseTier[];
  recordRescue: () => void;
  setRescues: (n: number) => void;
  addTier: () => void;
  updateTier: (id: string, patch: Partial<LicenseTier>) => void;
  removeTier: (id: string) => void;
  moveTier: (id: string, dir: -1 | 1) => void;
  importState: (data: { rescuesCompleted?: number; tiers?: LicenseTier[] }) => void;
  reset: () => void;
}

const STORAGE_KEY = 'r3f-rpg-builder-poli-license-v1';
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const uid = () => `tier_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;

function persist(s: Pick<RescueLicenseState, 'rescuesCompleted' | 'tiers'>): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ rescuesCompleted: s.rescuesCompleted, tiers: s.tiers })); } catch { /* ignore */ }
}
function load(): Pick<RescueLicenseState, 'rescuesCompleted' | 'tiers'> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return { rescuesCompleted: typeof p.rescuesCompleted === 'number' ? p.rescuesCompleted : 0, tiers: Array.isArray(p.tiers) ? p.tiers : clone(LICENSE_TIERS) };
    }
  } catch { /* ignore */ }
  return { rescuesCompleted: 0, tiers: clone(LICENSE_TIERS) };
}

export const useRescueLicenseStore = create<RescueLicenseState>((set, get) => {
  const save = () => persist(get());
  return {
    ...load(),
    recordRescue: () => { set({ rescuesCompleted: get().rescuesCompleted + 1 }); save(); },
    setRescues: (n) => { set({ rescuesCompleted: Math.max(0, n) }); save(); },
    addTier: () => { set({ tiers: [...get().tiers, { id: uid(), name: 'New Tier', icon: '🎖', requiredRescues: 0, requiredExp: 0 }] }); save(); },
    updateTier: (id, patch) => { set({ tiers: get().tiers.map((t) => (t.id === id ? { ...t, ...patch } : t)) }); save(); },
    removeTier: (id) => { set({ tiers: get().tiers.filter((t) => t.id !== id) }); save(); },
    moveTier: (id, dir) => {
      const tiers = [...get().tiers];
      const i = tiers.findIndex((t) => t.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= tiers.length) return;
      [tiers[i], tiers[j]] = [tiers[j], tiers[i]];
      set({ tiers }); save();
    },
    importState: (data) => {
      set({ rescuesCompleted: typeof data.rescuesCompleted === 'number' ? data.rescuesCompleted : get().rescuesCompleted, tiers: Array.isArray(data.tiers) ? data.tiers : get().tiers });
      save();
    },
    reset: () => { set({ rescuesCompleted: 0, tiers: clone(LICENSE_TIERS) }); save(); },
  };
});

// Highest tier whose requirements (rescues + exp) are met. Tiers are evaluated in array order.
export function getCurrentLicenseTier(): LicenseTier | undefined {
  const { rescuesCompleted, tiers } = useRescueLicenseStore.getState();
  const exp = useProgressionStore.getState().exp;
  let best: LicenseTier | undefined;
  for (const t of tiers) {
    if (rescuesCompleted >= t.requiredRescues && exp >= t.requiredExp) {
      if (!best || t.requiredRescues >= best.requiredRescues) best = t;
    }
  }
  return best ?? tiers[0];
}
