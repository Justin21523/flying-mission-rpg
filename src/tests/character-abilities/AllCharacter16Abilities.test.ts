import { describe, it, expect } from 'vitest';
import { SEED_ARSENAL_ABILITIES, SEED_CLONE_ABILITIES, ARSENAL_CHARACTER_IDS, abilitiesForCharacter } from '../../data/character-abilities/allCharacterAbilities';
import { CLONE_TYPES } from '../../types/cloneAbilityTypes';

// Batch F.7 — the 16-skill / 4-clone roster contract.
describe('AllCharacter16Abilities — clone roster', () => {
  it('has 128 abilities and 32 clone definitions (4 per hero)', () => {
    expect(SEED_ARSENAL_ABILITIES.length).toBe(128);
    expect(SEED_CLONE_ABILITIES.length).toBe(32);
    expect(SEED_ARSENAL_ABILITIES.filter((a) => a.abilityCategory === 'clone').length).toBe(32);
  });

  it('each hero has 4 clone abilities backed by a clone definition with all 4 distinct clone types', () => {
    for (const cid of ARSENAL_CHARACTER_IDS) {
      const clones = abilitiesForCharacter(cid).filter((a) => a.abilityCategory === 'clone');
      expect(clones.length, `${cid} clone abilities`).toBe(4);
      const defs = SEED_CLONE_ABILITIES.filter((c) => c.characterId === cid);
      expect(defs.length, `${cid} clone defs`).toBe(4);
      // every clone ability id is backed by a clone definition
      for (const c of clones) expect(defs.some((d) => d.abilityId === c.id), `${c.id} backed`).toBe(true);
      // all 4 clone types present (attack/defense/support/ultimate doubles)
      expect(new Set(defs.map((d) => d.cloneType))).toEqual(new Set(CLONE_TYPES));
    }
  });

  it('every clone ability sits on a clone-* slot', () => {
    for (const a of SEED_ARSENAL_ABILITIES.filter((x) => x.abilityCategory === 'clone')) {
      expect(a.abilitySlot.startsWith('clone-'), a.id).toBe(true);
    }
  });
});
