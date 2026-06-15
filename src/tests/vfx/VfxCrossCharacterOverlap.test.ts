import { describe, it, expect } from 'vitest';
import { scoreAbilityVfx, effectFingerprint } from '../../game/vfx/CinematicVfxQualityScorer';
import { auditAllVfx } from '../../game/vfx/vfxAudit';
import { getStyleProfile } from '../../data/cinematic-vfx/characterVfxStyleProfiles';
import { SEED_CINEMATIC_EFFECTS } from '../../data/character-abilities/allCharacterAbilities';

describe('VfxCrossCharacterOverlap', () => {
  it('the real 88 authored effects have no cross-character over-overlap', () => {
    const flagged = auditAllVfx().scores.filter((s) => s.checks.overlapsWithOtherCharacter);
    expect(flagged.map((s) => s.abilityId)).toEqual([]);
  });

  it('heroes have disjoint signatures + sub-threshold fingerprint overlap', () => {
    const jett = SEED_CINEMATIC_EFFECTS.find((e) => e.id === 'jett_rescue_rush_fx')!;
    const paul = SEED_CINEMATIC_EFFECTS.find((e) => e.id === 'paul_shield_wall_fx')!;
    // No shared signature objects or motion language (only generic shape layer-types may coincide).
    const sigJ = effectFingerprint(jett);
    const sigP = effectFingerprint(paul);
    for (const x of sigJ) if (x.startsWith('sig:') || x.startsWith('motion:')) expect(sigP.has(x)).toBe(false);
    // Overall similarity stays well under the overlap-detection threshold (0.6).
    let inter = 0;
    for (const x of sigJ) if (sigP.has(x)) inter++;
    const jaccard = inter / (sigJ.size + sigP.size - inter);
    expect(jaccard).toBeLessThan(0.6);
  });

  it('the detector flags an effect cloned onto another hero', () => {
    const jett = SEED_CINEMATIC_EFFECTS.find((e) => e.id === 'jett_cyclone_fx')!;
    // Same visual recipe, but stamped as Paul — should overlap with the real Jett library.
    const clone = { ...jett, id: 'fake_clone_fx', characterId: 'char_paul' };
    const score = scoreAbilityVfx('paul_shield_wall', clone, getStyleProfile('char_paul'), [...SEED_CINEMATIC_EFFECTS, clone]);
    expect(score.checks.overlapsWithOtherCharacter).toBe(true);
  });
});
