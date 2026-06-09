import { create } from 'zustand';
import { getResourceDef } from './editorCollectibleStore';
import { useTransformStore } from './transformStore';
import { playSfx } from '../game/audio/sfx';

// POLI — runtime amounts for the collectible economy. Collecting a primitive calls add(resourceId, value).
// When a resource reaches its threshold: if `auto`, its ability fires immediately and the amount resets; else
// the resource is ARMED (amount capped at threshold) until the player presses its key → spend() fires it.
// Session/runtime only — the tunable config (types/resources) lives in editorCollectibleStore.

interface ResourceState {
  amounts: Record<string, number>; // resourceId → current amount
  armed: Record<string, boolean>;  // resourceId → ready to spend (non-auto, reached threshold)
  pulse: number;                   // bumps on any change so polled HUDs refresh cheaply
  add: (resourceId: string, n: number) => void;
  spend: (resourceId: string) => boolean; // fire an armed resource (returns true if it fired)
  setAll: (amounts: Record<string, number>) => void; // save/load
  resetAll: () => void;
}

// Fire a resource's ability through the player's ability system, tinted with the resource colour.
function fire(resourceId: string): void {
  const def = getResourceDef(resourceId);
  if (!def?.abilityType) return;
  useTransformStore.getState().triggerAbility({
    color: def.color,
    type: def.abilityType,
    radius: def.abilityRadius,
    duration: def.abilityDuration,
    strength: def.abilityStrength,
    cooldownSec: 0,
  });
}

export const useResourceStore = create<ResourceState>((set, get) => ({
  amounts: {},
  armed: {},
  pulse: 0,
  add: (resourceId, n) => {
    const def = getResourceDef(resourceId);
    const threshold = def?.threshold ?? Infinity;
    const cur = (get().amounts[resourceId] ?? 0) + n;
    if (cur >= threshold) {
      if (def?.auto) {
        fire(resourceId);
        set((s) => ({ amounts: { ...s.amounts, [resourceId]: cur - threshold }, pulse: s.pulse + 1 }));
      } else {
        // Arm and cap at threshold until spent.
        set((s) => ({ amounts: { ...s.amounts, [resourceId]: threshold }, armed: { ...s.armed, [resourceId]: true }, pulse: s.pulse + 1 }));
      }
    } else {
      set((s) => ({ amounts: { ...s.amounts, [resourceId]: cur }, pulse: s.pulse + 1 }));
    }
    playSfx('ui');
  },
  spend: (resourceId) => {
    if (!get().armed[resourceId]) return false;
    fire(resourceId);
    set((s) => ({ amounts: { ...s.amounts, [resourceId]: 0 }, armed: { ...s.armed, [resourceId]: false }, pulse: s.pulse + 1 }));
    return true;
  },
  setAll: (amounts) => set((s) => ({ amounts: { ...amounts }, armed: {}, pulse: s.pulse + 1 })),
  resetAll: () => set((s) => ({ amounts: {}, armed: {}, pulse: s.pulse + 1 })),
}));
