import { describe, it, expect } from 'vitest';
import { validateLoadout } from '../../game/character-abilities/cinematicAbilityValidation';
import { SEED_ABILITY_LOADOUTS } from '../../data/character-abilities/arsenalKits';
import { SEED_ARSENAL_ABILITIES } from '../../data/character-abilities/allCharacterAbilities';

const catOf = (id: string) => SEED_ARSENAL_ABILITIES.find((a) => a.id === id)?.abilityCategory;

describe('AbilityLoadout', () => {
  it('seeds a valid default loadout for all 8 heroes', () => {
    expect(SEED_ABILITY_LOADOUTS.length).toBe(8);
    for (const lo of SEED_ABILITY_LOADOUTS) {
      const r = validateLoadout(lo, catOf);
      expect(r.ok, `${lo.characterId}: ${r.errors.join(', ')}`).toBe(true);
    }
  });

  it('rejects a non-ultimate ability in the ultimate slot', () => {
    const lo = SEED_ABILITY_LOADOUTS[0];
    const attack = SEED_ARSENAL_ABILITIES.find((a) => a.characterId === lo.characterId && a.abilityCategory === 'attack')!;
    expect(validateLoadout({ ...lo, ultimate: attack.id }, catOf).ok).toBe(false);
  });

  it('rejects an attack ability in the defense slot', () => {
    const lo = SEED_ABILITY_LOADOUTS[0];
    const attack = SEED_ARSENAL_ABILITIES.find((a) => a.characterId === lo.characterId && a.abilityCategory === 'attack')!;
    expect(validateLoadout({ ...lo, defense: attack.id }, catOf).ok).toBe(false);
  });
});
