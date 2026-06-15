import { describe, it, expect } from 'vitest';
import { SEED_ARSENAL_ABILITIES, SEED_ARSENAL_SKILLS, SEED_CINEMATIC_EFFECTS, ARSENAL_CHARACTER_IDS, abilitiesForCharacter } from '../../data/character-abilities/allCharacterAbilities';

const skillIds = new Set(SEED_ARSENAL_SKILLS.map((s) => s.id));
const effectIds = new Set(SEED_CINEMATIC_EFFECTS.map((e) => e.id));

describe('AllCharacterAbilities — 8 heroes × 11', () => {
  it('has all 8 heroes with 6 attack / 3 defense / 2 ultimate each (≥88 total)', () => {
    expect(ARSENAL_CHARACTER_IDS.length).toBe(8);
    expect(SEED_ARSENAL_ABILITIES.length).toBeGreaterThanOrEqual(88);
    for (const cid of ARSENAL_CHARACTER_IDS) {
      const a = abilitiesForCharacter(cid);
      expect(a.filter((x) => x.abilityCategory === 'attack').length, `${cid} attacks`).toBeGreaterThanOrEqual(6);
      expect(a.filter((x) => x.abilityCategory === 'defense').length, `${cid} defenses`).toBeGreaterThanOrEqual(3);
      expect(a.filter((x) => x.abilityCategory === 'ultimate').length, `${cid} ultimates`).toBeGreaterThanOrEqual(2);
    }
  });

  it('every ability resolves its skill + cinematic effect; attacks have a hit volume', () => {
    for (const a of SEED_ARSENAL_ABILITIES) {
      expect(skillIds.has(a.combat.skillDefinitionId), a.id).toBe(true);
      expect(effectIds.has(a.vfx.cinematicEffectId), a.id).toBe(true);
      if (a.abilityCategory === 'attack') expect(a.combat.hitVolume, a.id).toBeTruthy();
    }
  });

  it('every arsenal skill is a player-faction CombatSkillDefinition with the cinematic effect linked', () => {
    for (const s of SEED_ARSENAL_SKILLS) {
      expect(s.faction ?? 'player').toBe('player');
      expect(s.effectDefinitionId && effectIds.has(s.effectDefinitionId), s.id).toBe(true);
    }
  });
});
