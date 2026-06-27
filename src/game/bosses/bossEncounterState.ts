// Batch E — pure boss intro/enrage helpers (unit-tested; BossDirector wires them to the runtime).

export interface EnrageConfig { afterSeconds: number; damageMultiplier: number; cinematicEffectId?: string }

export interface EnrageState { enraged: boolean; damageMult: number; remaining: number }

// Enrage by fight-elapsed time: before the threshold damageMult=1; at/after it the boss hits harder forever.
export function enrageState(elapsedSeconds: number, cfg?: EnrageConfig): EnrageState {
  if (!cfg) return { enraged: false, damageMult: 1, remaining: Infinity };
  const enraged = elapsedSeconds >= cfg.afterSeconds;
  return { enraged, damageMult: enraged ? cfg.damageMultiplier : 1, remaining: Math.max(0, cfg.afterSeconds - elapsedSeconds) };
}

// Whether the intro is still playing (gate attacks/movement) given when it started + its duration.
export function introActive(nowSeconds: number, introUntilSeconds: number): boolean {
  return nowSeconds < introUntilSeconds;
}
