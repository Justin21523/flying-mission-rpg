import { describe, it, expect } from 'vitest';
import { scoreAbilityVfx } from '../../game/vfx/CinematicVfxQualityScorer';
import { auditAllVfx } from '../../game/vfx/vfxAudit';
import { getStyleProfile } from '../../data/cinematic-vfx/characterVfxStyleProfiles';
import { SEED_CINEMATIC_EFFECTS } from '../../data/character-abilities/allCharacterAbilities';
import { SHOWCASE_ABILITY_IDS } from '../../data/cinematic-vfx/showcaseAbilities';
import type { CinematicEffectDefinition } from '../../types/cinematicVfxTypes';

describe('CinematicVfxQualityScorer', () => {
  const audit = auditAllVfx();

  it('scores all 128 abilities', () => {
    expect(audit.scores).toHaveLength(128);
  });

  it('every showcase ability scores >= 85', () => {
    const showcase = audit.scores.filter((s) => SHOWCASE_ABILITY_IDS.has(s.abilityId));
    expect(showcase).toHaveLength(24);
    for (const s of showcase) expect(s.score, s.abilityId).toBeGreaterThanOrEqual(85);
  });

  it('every non-showcase ability scores >= 65', () => {
    const rest = audit.scores.filter((s) => !SHOWCASE_ABILITY_IDS.has(s.abilityId));
    for (const s of rest) expect(s.score, s.abilityId).toBeGreaterThanOrEqual(65);
  });

  it('no ability fails its threshold', () => {
    expect(audit.failing.map((s) => s.abilityId)).toEqual([]);
  });

  it('scoring is deterministic', () => {
    const a = auditAllVfx();
    const b = auditAllVfx();
    expect(a.scores.map((s) => s.score)).toEqual(b.scores.map((s) => s.score));
  });

  it('a particle-only effect fails', () => {
    const particleOnly: CinematicEffectDefinition = {
      id: 'fake_particle_only', name: 'fake', effectFamily: 'speed', characterId: 'char_jett',
      signatureObjectIds: ['thrusterStreak'], motionLanguage: 'fast-linear',
      layers: [
        { id: 'a', layerType: 'particle-burst', v2EffectType: 'starburst_effect', startTimeSeconds: 0, durationSeconds: 0.5, attachTo: 'character-root' },
        { id: 'b', layerType: 'particle-trail', v2EffectType: 'starburst_effect', startTimeSeconds: 0, durationSeconds: 0.5, attachTo: 'character-root' },
      ],
      timeline: { totalDurationSeconds: 0.5 }, pooling: { poolId: 'x', reusable: true }, cleanup: { autoCleanup: true },
    };
    const score = scoreAbilityVfx('jett_overdrive', particleOnly, getStyleProfile('char_jett'), SEED_CINEMATIC_EFFECTS);
    expect(score.checks.overUsesGenericParticles).toBe(true);
    expect(score.passed).toBe(false);
  });
});
