import { describe, it, expect } from 'vitest';
import { validateAbility } from '../../game/character-abilities/cinematicAbilityValidation';
import { SEED_ARSENAL_ABILITIES, SEED_ARSENAL_SKILLS, SEED_CINEMATIC_EFFECTS } from '../../data/character-abilities/allCharacterAbilities';

const skillExists = (id: string) => SEED_ARSENAL_SKILLS.some((s) => s.id === id);
const effectExists = (id: string) => SEED_CINEMATIC_EFFECTS.some((e) => e.id === id);

describe('CinematicAbilityValidation', () => {
  it('every seeded ability validates', () => {
    for (const a of SEED_ARSENAL_ABILITIES) {
      const r = validateAbility(a, effectExists, skillExists);
      expect(r.ok, `${a.id}: ${r.errors.join(', ')}`).toBe(true);
    }
  });

  it('rejects a missing skill / effect', () => {
    const a = SEED_ARSENAL_ABILITIES[0];
    expect(validateAbility({ ...a, combat: { ...a.combat, skillDefinitionId: 'nope' } }, effectExists, skillExists).ok).toBe(false);
    expect(validateAbility({ ...a, vfx: { cinematicEffectId: 'nope' } }, effectExists, skillExists).ok).toBe(false);
  });

  it('rejects a category/slot mismatch', () => {
    const ult = SEED_ARSENAL_ABILITIES.find((a) => a.abilityCategory === 'ultimate')!;
    expect(validateAbility({ ...ult, abilitySlot: 'attack-1' }, effectExists, skillExists).ok).toBe(false);
  });
});
