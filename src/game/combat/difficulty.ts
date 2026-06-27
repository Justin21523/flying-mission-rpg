import type { Difficulty } from '../../types/game/settings';
import type { RunConfig } from '../../data/progression/runConfig';

// Batch P — pure difficulty / scaling helpers (unit-tested; CombatDirector + buildProbe wire them to stores).

// Effective god-mode = the explicit dev toggle OR 'easy' difficulty (invincible + auto-complete segments).
export function effectiveGodMode(devFlag: boolean, difficulty: Difficulty): boolean {
  return devFlag || difficulty === 'easy';
}

// Per-difficulty incoming-damage multiplier (easy/normal = 1, hard tougher, ng-plus toughest). easy is
// invincible anyway.
export function difficultyDamageMult(difficulty: Difficulty): number {
  return difficulty === 'ng-plus' ? 1.7 : difficulty === 'hard' ? 1.4 : 1;
}

// Wave 4 — per-difficulty enemy HP multiplier. Only New Game+ scales HP (easy/normal/hard unchanged).
export function enemyHpMult(difficulty: Difficulty): number {
  return difficulty === 'ng-plus' ? 1.6 : 1;
}

// Wave 4 — per-difficulty bonus added to a spawn group's elite-affix policy (richer affixes in NG+). Returns
// the additive chance/max bump and whether to force a policy onto groups that have none.
export function enemyAffixBonus(difficulty: Difficulty): { chanceBonus: number; maxBonus: number } {
  return difficulty === 'ng-plus' ? { chanceBonus: 0.4, maxBonus: 1 } : { chanceBonus: 0, maxBonus: 0 };
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
