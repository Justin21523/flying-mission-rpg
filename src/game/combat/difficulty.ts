import type { Difficulty } from '../../types/game/settings';
import type { RunConfig } from '../../data/progression/runConfig';

// Batch P — pure difficulty / scaling helpers (unit-tested; CombatDirector + buildProbe wire them to stores).

// Effective god-mode = the explicit dev toggle OR 'easy' difficulty (invincible + auto-complete segments).
export function effectiveGodMode(devFlag: boolean, difficulty: Difficulty): boolean {
  return devFlag || difficulty === 'easy';
}

// Per-difficulty incoming-damage multiplier (easy/normal = 1, hard tougher). easy is invincible anyway.
export function difficultyDamageMult(difficulty: Difficulty): number {
  return difficulty === 'hard' ? 1.4 : 1;
}

// Arena-run incoming-damage multiplier: scales with the round (1 outside runs). Mirrors the HP scaling so
// late Endless/Roguelite rounds also hit harder.
export function runDamageMult(active: boolean, round: number, dmgScalePerRound: number): number {
  if (!active) return 1;
  return 1 + Math.max(0, round - 1) * dmgScalePerRound;
}

// Convenience: the run-config's dmgScalePerRound for a mode, with a safe fallback.
export function dmgScaleForMode(cfg: RunConfig | undefined, mode: 'endless' | 'roguelite'): number {
  return cfg?.[mode]?.dmgScalePerRound ?? 0;
}
