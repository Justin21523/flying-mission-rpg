import { describe, it, expect } from 'vitest';
import { routeActionKey } from '../../game/character-skills/abilityPages';
import { SEED_ARSENAL_ABILITIES } from '../../data/character-abilities/allCharacterAbilities';

// Batch F.7 — pressing 4/5/Z/X on a given page resolves to the RIGHT ability for the ACTIVE character, across
// all 4 pages. Mirrors the runtime path (routeActionKey(code, page) → getAbilityBySlot(char, slot)).
function abilityFor(characterId: string, code: string, page: number): string | undefined {
  const slot = routeActionKey(code, page);
  if (!slot) return undefined;
  return SEED_ARSENAL_ABILITIES.find((a) => a.characterId === characterId && a.abilitySlot === slot)?.id;
}

describe('Ability page casting (4 / 5 / Z / X across 4 pages)', () => {
  it('Jett page 1 binds attack-1 / clone-1 / attack-2 / attack-3', () => {
    expect(abilityFor('char_jett', 'Digit4', 0)).toBe('jett_dash_slash');
    expect(abilityFor('char_jett', 'Digit5', 0)).toBe('jett_afterimage_wingman'); // clone-1
    expect(abilityFor('char_jett', 'KeyZ', 0)).toBe('jett_rescue_rush');
    expect(abilityFor('char_jett', 'KeyX', 0)).toBe('jett_courier_drop');
  });

  it('one clone is reachable on every page', () => {
    expect(abilityFor('char_jett', 'Digit5', 0)).toBe('jett_afterimage_wingman'); // clone-1 (P1)
    expect(abilityFor('char_jett', 'KeyZ', 1)).toBe('jett_rescue_escort');        // clone-2 (P2)
    expect(abilityFor('char_jett', 'KeyX', 2)).toBe('jett_guard_phantom');        // clone-3 (P3)
    expect(abilityFor('char_jett', 'KeyZ', 3)).toBe('jett_overdrive_echo');       // clone-4 (P4)
  });

  it('page 4 binds defense-3 / ultimate-1 / clone-4 / ultimate-2', () => {
    expect(abilityFor('char_jett', 'Digit4', 3)).toBe('jett_rescue_shield');
    expect(abilityFor('char_jett', 'Digit5', 3)).toBe('jett_overdrive');
    expect(abilityFor('char_chase', 'KeyX', 3)).toBe('chase_surveillance_grid'); // ultimate-2
    expect(abilityFor('char_donnie', 'KeyZ', 2)).toBe('donnie_repair_station');  // signature on P3
  });

  it('every hero has a distinct, non-empty 4-key set on every page', () => {
    const heroes = [...new Set(SEED_ARSENAL_ABILITIES.map((a) => a.characterId))];
    const codes = ['Digit4', 'Digit5', 'KeyZ', 'KeyX'];
    for (const cid of heroes) {
      for (let page = 0; page < 4; page++) {
        const ids = codes.map((c) => abilityFor(cid, c, page));
        expect(ids.every((x) => x != null), `${cid} page ${page} all bound`).toBe(true);
        expect(new Set(ids).size, `${cid} page ${page} distinct`).toBe(4);
        // exactly one of the four keys is a clone ability
        const clones = ids.filter((id) => id && SEED_ARSENAL_ABILITIES.find((a) => a.id === id)?.abilityCategory === 'clone');
        expect(clones.length, `${cid} page ${page} one clone`).toBe(1);
      }
    }
  });

  it('resolution uses the ACTIVE character (no leak across heroes)', () => {
    expect(abilityFor('char_jett', 'Digit5', 0)).toBe('jett_afterimage_wingman');
    expect(abilityFor('char_paul', 'Digit5', 0)).toBe('paul_patrol_partner');
    expect(abilityFor('char_jett', 'Digit5', 0)).not.toBe(abilityFor('char_paul', 'Digit5', 0));
  });
});
