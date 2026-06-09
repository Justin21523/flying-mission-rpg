import { create } from 'zustand';

// POLI yokai-hunt (Phase H) — temporary auto-attacking summons: a 替身 clone that darts to nearby yokai, and a
// sentry drone that orbits the player. Module-mutable list (positions mutated in useFrame, no per-frame store
// writes) + a version counter bumped on spawn/expire so SummonLayer mounts/unmounts them. Each emits a radius
// damage pulse via applySuperDamage at its position on its own timer (auto-AI — works with no player input).

export type SummonKind = 'clone' | 'sentry';

export interface Summon {
  id: string;
  kind: SummonKind;
  x: number; y: number; z: number;
  until: number;       // perf-time it despawns
  nextHitAt: number;   // perf-time of its next auto-attack
  color: string;
  damage: number;
  radius: number;
  orbitAng: number;    // sentry orbit phase
}

export const liveSummons: Summon[] = [];
const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
let uid = 0;

interface SummonState { version: number; bump: () => void; sweep: () => void; clearAll: () => void; }
export const useSummonStore = create<SummonState>((set, get) => ({
  version: 0,
  bump: () => set({ version: get().version + 1 }),
  sweep: () => {
    const t = now();
    let changed = false;
    for (let i = liveSummons.length - 1; i >= 0; i--) if (liveSummons[i].until < t) { liveSummons.splice(i, 1); changed = true; }
    if (changed) set({ version: get().version + 1 });
  },
  clearAll: () => { liveSummons.length = 0; set({ version: get().version + 1 }); },
}));

// Called by transformStore.triggerSuperMove for kinds 'clone' / 'sentry'.
export function spawnSummon(kind: SummonKind, x: number, y: number, z: number, color: string, damage: number, radius: number, durationSec: number): void {
  const t = now();
  liveSummons.push({ id: `sm_${uid++}`, kind, x, y, z, until: t + Math.max(1, durationSec), nextHitAt: t + 0.4, color, damage, radius, orbitAng: Math.random() * Math.PI * 2 });
  useSummonStore.getState().bump();
}
