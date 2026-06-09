import { create } from 'zustand';
import { getBoostConfig } from './editorBoostStore';
import { playerMotion } from '../game/player/playerMotion';
import { useTransformStore } from './transformStore';
import { playSfx } from '../game/audio/sfx';

// POLI — runtime boost state: the collectible meter + super-boost mode. Pickups (PickupLayer) call
// collect(); when the meter is full the player presses R to activateSuper() → fast move + flight +
// afterimage trail (AfterimageLayer), draining over the configured duration. Abilities can also refill
// the meter / trigger transient pickup-attract + radar-scan windows. Runtime is saved per slot.
interface BoostState {
  meter: number;
  collected: number;
  superActive: boolean;
  superUntil: number;     // perf.now()/1000 when super ends
  attractUntil: number;   // window during which pickups drift toward the player
  attractRadius: number;
  scanUntil: number;      // window during which the radar reveals more
  collect: (value: number) => void;
  addMeter: (n: number) => void;
  activateSuper: () => boolean;
  tick: (dt: number) => void;
  attractPickups: (radius: number) => void;
  pulseScan: (durationSec: number) => void;
  importState: (data: { meter?: number; collected?: number }) => void;
  reset: () => void;
}

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;

export const useBoostStore = create<BoostState>((set, get) => ({
  meter: 0,
  collected: 0,
  superActive: false,
  superUntil: 0,
  attractUntil: 0,
  attractRadius: 0,
  scanUntil: 0,

  collect: (value) => {
    const max = getBoostConfig().meterMax;
    set({ meter: Math.min(max, get().meter + value), collected: get().collected + 1 });
    playSfx('ui');
  },
  addMeter: (n) => { const max = getBoostConfig().meterMax; set({ meter: Math.max(0, Math.min(max, get().meter + n)) }); },

  activateSuper: () => {
    const cfg = getBoostConfig();
    if (get().superActive || get().meter < cfg.meterMax) return false;
    playerMotion.superMult = cfg.superSpeedMult;
    if (cfg.superFlies) useTransformStore.getState().setFlying(true);
    set({ superActive: true, superUntil: now() + cfg.superDurationSec, meter: 0 });
    playSfx('ability');
    return true;
  },

  tick: (dt) => {
    const s = get();
    if (s.superActive) {
      // Drain visually + end on timer.
      const remaining = s.superUntil - now();
      const max = getBoostConfig().meterMax;
      set({ meter: Math.max(0, (remaining / getBoostConfig().superDurationSec) * max) });
      if (remaining <= 0) {
        playerMotion.superMult = 1;
        if (getBoostConfig().superFlies) useTransformStore.getState().setFlying(false);
        set({ superActive: false, meter: 0 });
      }
    }
    void dt;
  },

  attractPickups: (radius) => set({ attractUntil: now() + 1.2, attractRadius: radius }),
  pulseScan: (durationSec) => set({ scanUntil: now() + Math.max(2, durationSec) }),

  importState: (data) => set({ meter: typeof data.meter === 'number' ? data.meter : get().meter, collected: typeof data.collected === 'number' ? data.collected : get().collected }),
  reset: () => { playerMotion.superMult = 1; set({ meter: 0, collected: 0, superActive: false, superUntil: 0, attractUntil: 0, scanUntil: 0 }); },
}));

export function isAttracting(): { on: boolean; radius: number } {
  const s = useBoostStore.getState();
  return { on: now() < s.attractUntil, radius: s.attractRadius };
}
export function isScanning(): boolean { return now() < useBoostStore.getState().scanUntil; }
