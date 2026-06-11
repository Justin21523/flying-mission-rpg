import { create } from 'zustand';
import type { FlightEventDef } from '../../types/game/flightEvent';
import { useProgressionStore } from '../progressionStore';
import { useWalletStore } from '../walletStore';
import { getFlightTuning } from './editorFlightStore';
import { nextCombo, rewardFor, flightGrade, type FlightGrade } from '../../game/flight/world/flightRewards';

// World-flight reward bus + score/combo (mirrors yokaiCombatStore's queue+drain). On collecting a flight item
// the director calls award(): it grants exp + coins, bumps the combo/score, sets a boost timer for boost
// pickups, and queues a celebration event the FlightCelebrationLayer drains (dancing clone + +XP/+coin popups).
export interface FlightCollect { x: number; y: number; z: number; exp: number; coin: number; combo: number; golden?: boolean; label?: string; noClone?: boolean }
const queue: FlightCollect[] = [];
export function drainFlightCollects(out: FlightCollect[]): number {
  const n = queue.length;
  for (let i = 0; i < n; i++) out[i] = queue[i];
  queue.length = 0;
  return n;
}

const now = () => performance.now() / 1000;

export interface FlightResult { score: number; collected: number; bestCombo: number; grade: FlightGrade }

interface FlightScoreState {
  score: number;
  combo: number;
  comboUntil: number;
  boostUntil: number;
  collected: number;
  bestCombo: number;
  lastResult: FlightResult | null; // snapshot of the just-finished leg (shown on arrival)
  award: (def: FlightEventDef, pos: [number, number, number], golden?: boolean) => void;
  awardBonus: (pos: [number, number, number], exp: number, coin: number, label: string) => void;
  boostActive: () => boolean;
  reset: () => void;
}

export const useFlightScoreStore = create<FlightScoreState>((set, get) => ({
  score: 0,
  combo: 0,
  comboUntil: 0,
  boostUntil: 0,
  collected: 0,
  bestCombo: 0,
  lastResult: null,
  award: (def, pos, golden = false) => {
    const t = now();
    const s = get();
    const tuning = getFlightTuning();
    const combo = nextCombo(s.combo, t, s.comboUntil);
    const base = rewardFor(def, combo);
    const mul = golden ? Math.max(1, tuning.goldenMultiplier) : 1;
    const exp = Math.round(base.exp * mul);
    const coin = Math.round(base.coin * mul);
    useProgressionStore.getState().addExp(exp);
    useWalletStore.getState().addCoins(coin);
    queue.push({ x: pos[0], y: pos[1], z: pos[2], exp, coin, combo, golden });
    set({
      combo,
      comboUntil: t + Math.max(0.5, tuning.comboWindowSec),
      score: s.score + exp + coin,
      collected: s.collected + 1,
      bestCombo: Math.max(s.bestCombo, combo),
      boostUntil: def.kind === 'boost' ? t + Math.max(0.5, tuning.boostDurationSec) : s.boostUntil,
    });
  },
  // One-off bonus (distance milestone / perfect ring) — grants reward + a labelled popup, no clone, no combo.
  awardBonus: (pos, exp, coin, label) => {
    if (exp > 0) useProgressionStore.getState().addExp(exp);
    if (coin > 0) useWalletStore.getState().addCoins(coin);
    queue.push({ x: pos[0], y: pos[1], z: pos[2], exp, coin, combo: 0, label, noClone: true });
    set({ score: get().score + exp + coin });
  },
  boostActive: () => now() < get().boostUntil,
  // Snapshot the just-finished leg into lastResult (kept across reset for the arrival summary), then clear live.
  reset: () => {
    const s = get();
    const lastResult: FlightResult | null = s.score > 0
      ? { score: s.score, collected: s.collected, bestCombo: s.bestCombo, grade: flightGrade(s.score) }
      : s.lastResult;
    queue.length = 0;
    set({ score: 0, combo: 0, comboUntil: 0, boostUntil: 0, collected: 0, bestCombo: 0, lastResult });
  },
}));
