import type { FlightEventDef } from '../../../types/game/flightEvent';

// Pure flight-reward maths (no stores → unit-testable).

// Combo multiplier: 1× at combo 1, +0.5× per extra link, capped at 5×.
export function comboMultiplier(combo: number): number {
  return Math.min(5, 1 + Math.max(0, combo - 1) * 0.5);
}

// Next combo count: keep climbing if this pickup landed within the still-open window, else restart at 1.
export function nextCombo(prevCombo: number, now: number, comboUntil: number): number {
  return now <= comboUntil ? prevCombo + 1 : 1;
}

// Reward for collecting an event: base exp/coin (authored, or derived from `value`) × the combo multiplier.
// Stunt rings get a small chain bonus on top.
export function rewardFor(def: Pick<FlightEventDef, 'kind' | 'value' | 'expReward' | 'coinReward'>, combo: number): { exp: number; coin: number } {
  const v = def.value ?? 1;
  const baseExp = def.expReward ?? v * 5;
  const baseCoin = def.coinReward ?? v * 2;
  const ring = def.kind === 'stunt_ring' ? 1.5 : 1;
  const m = comboMultiplier(combo) * ring;
  return { exp: Math.round(baseExp * m), coin: Math.round(baseCoin * m) };
}
