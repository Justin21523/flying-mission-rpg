import { create } from 'zustand';

// POLI — editable config for ground pickups + the boost meter + super-boost mode (⭐ Boost tab). Runtime
// state (current meter, super active) lives in boostStore; this is the tunable design data. Auto-persisted.
export interface BoostConfig {
  pickupModelAssetId: string; // model-library id for the collectible (empty = glowing orb fallback)
  pickupValue: number;        // meter gained per pickup
  pickupCount: number;        // pickups scattered per area
  pickupSpread: number;       // scatter half-extent (world units)
  meterMax: number;           // meter needed to enable super mode
  superSpeedMult: number;     // movement multiplier while super
  superDurationSec: number;   // how long super lasts
  superFlies: boolean;        // super mode also forces flight
  afterimageIntervalSec: number; // seconds between afterimage ghosts
  afterimageLifeSec: number;     // how long each ghost fades over
}

interface EditorBoostState extends BoostConfig {
  set: (patch: Partial<BoostConfig>) => void;
  importState: (data: Partial<BoostConfig>) => void;
  reset: () => void;
}

const STORAGE_KEY = 'r3f-rpg-builder-poli-boost-v1';
const DEFAULTS: BoostConfig = {
  pickupModelAssetId: '',
  pickupValue: 20,
  pickupCount: 8,
  pickupSpread: 28,
  meterMax: 100,
  superSpeedMult: 2.6,
  superDurationSec: 6,
  superFlies: true,
  afterimageIntervalSec: 0.08,
  afterimageLifeSec: 0.5,
};

function persist(s: BoostConfig): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}
function load(): BoostConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) { const p = JSON.parse(raw); return { ...DEFAULTS, ...p }; }
  } catch { /* ignore */ }
  return { ...DEFAULTS };
}
const pick = (s: EditorBoostState): BoostConfig => ({
  pickupModelAssetId: s.pickupModelAssetId, pickupValue: s.pickupValue, pickupCount: s.pickupCount,
  pickupSpread: s.pickupSpread, meterMax: s.meterMax, superSpeedMult: s.superSpeedMult,
  superDurationSec: s.superDurationSec, superFlies: s.superFlies,
  afterimageIntervalSec: s.afterimageIntervalSec, afterimageLifeSec: s.afterimageLifeSec,
});

export const useEditorBoostStore = create<EditorBoostState>((set, get) => ({
  ...load(),
  set: (patch) => { set(patch); persist(pick(get())); },
  importState: (data) => { set({ ...DEFAULTS, ...data }); persist(pick(get())); },
  reset: () => { set({ ...DEFAULTS }); persist(DEFAULTS); },
}));

export function getBoostConfig(): BoostConfig { return pick(useEditorBoostStore.getState()); }
