import type { CinematicVfxQualityScore } from '../../types/characterVfxStyleTypes';
import { SEED_ARSENAL_ABILITIES, SEED_CINEMATIC_EFFECTS } from '../../data/character-abilities/allCharacterAbilities';
import { getStyleProfile } from '../../data/cinematic-vfx/characterVfxStyleProfiles';
import { scoreAbilityVfx } from './CinematicVfxQualityScorer';

// Audit helpers (Batch F.6) — score the whole authored arsenal against the style profiles. Used by the
// 🎨 VFX Quality editor (Audit sub-section), the showcase debug panel, and the test suites.

export interface VfxAuditResult {
  scores: CinematicVfxQualityScore[];
  failing: CinematicVfxQualityScore[];
  perCharacterAverage: Record<string, number>;
}

export function auditAllVfx(): VfxAuditResult {
  const effectById = new Map(SEED_CINEMATIC_EFFECTS.map((e) => [e.id, e]));
  const scores: CinematicVfxQualityScore[] = [];
  for (const ability of SEED_ARSENAL_ABILITIES) {
    const effect = effectById.get(ability.vfx.cinematicEffectId);
    if (!effect) continue;
    const profile = getStyleProfile(ability.characterId);
    scores.push(scoreAbilityVfx(ability.id, effect, profile, SEED_CINEMATIC_EFFECTS));
  }
  const failing = scores.filter((s) => !s.passed);
  const byChar: Record<string, number[]> = {};
  for (const s of scores) (byChar[s.characterId] ??= []).push(s.score);
  const perCharacterAverage: Record<string, number> = {};
  for (const [c, arr] of Object.entries(byChar)) {
    perCharacterAverage[c] = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
  }
  return { scores, failing, perCharacterAverage };
}
