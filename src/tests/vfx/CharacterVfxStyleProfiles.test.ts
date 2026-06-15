import { describe, it, expect } from 'vitest';
import { SEED_VFX_STYLE_PROFILES, getStyleProfile } from '../../data/cinematic-vfx/characterVfxStyleProfiles';
import { ARSENAL_CHARACTER_IDS } from '../../data/character-abilities/allCharacterAbilities';
import { signaturePieces } from '../../data/cinematic-vfx/signatureEffectLibrary';

describe('CharacterVfxStyleProfiles', () => {
  it('defines a profile for all 8 heroes', () => {
    expect(SEED_VFX_STYLE_PROFILES).toHaveLength(8);
    for (const cid of ARSENAL_CHARACTER_IDS) {
      expect(getStyleProfile(cid)).toBeDefined();
    }
  });

  it('every hero has a distinct motion language', () => {
    const motions = SEED_VFX_STYLE_PROFILES.map((p) => p.motionLanguage);
    expect(new Set(motions).size).toBe(motions.length);
  });

  it('each profile lists >= 5 signature objects, all backed by a signature piece', () => {
    for (const p of SEED_VFX_STYLE_PROFILES) {
      expect(p.signatureObjects.length).toBeGreaterThanOrEqual(5);
      const pieces = signaturePieces(p.characterId);
      for (const obj of p.signatureObjects) {
        expect(pieces[obj], `${p.characterId}.${obj} should have a signature piece`).toBeTypeOf('function');
      }
    }
  });

  it('readability rules avoid same-as references to real other heroes', () => {
    const ids = new Set<string>(ARSENAL_CHARACTER_IDS);
    for (const p of SEED_VFX_STYLE_PROFILES) {
      for (const other of p.readabilityRules.avoidSameAsCharacterIds) {
        expect(ids.has(other)).toBe(true);
        expect(other).not.toBe(p.characterId);
      }
    }
  });
});
