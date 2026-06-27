import { describe, it, expect } from 'vitest';
import { SEED_CHARACTER_KITS } from './characterCombatKits';
import { SEED_KIT_SKILLS } from './kitSkills';
import { SEED_PARTNER_FUSIONS } from '../support-combat/partnerFusions';

// Wave 2 — Jerome / Bello / Flip combat kits + their partner fusions are complete and cross-resolve.
const NEW_HEROES = ['char_jerome', 'char_bello', 'char_flip'];
const SLOTS = ['basic', 'special1', 'special2', 'aoe', 'defense', 'utility', 'ultimatePlaceholder'] as const;

describe('Wave 2 hero kits', () => {
  const skillIds = new Set(SEED_KIT_SKILLS.map((s) => s.id));

  it('all 8 heroes now have a combat kit', () => {
    const kitted = new Set(SEED_CHARACTER_KITS.map((k) => k.characterId));
    for (const h of ['char_jett', 'char_donnie', 'char_paul', 'char_chase', ...NEW_HEROES]) {
      expect(kitted.has(h), h).toBe(true);
    }
  });

  it('each new hero kit fills all 7 slots with resolvable, owned skills', () => {
    for (const h of NEW_HEROES) {
      const kit = SEED_CHARACTER_KITS.find((k) => k.characterId === h)!;
      expect(kit, h).toBeTruthy();
      for (const slot of SLOTS) {
        const id = kit.defaultSkillIds[slot];
        expect(id, `${h}.${slot}`).toBeTruthy();
        expect(skillIds.has(id!), `${h}.${slot}=${id} resolves`).toBe(true);
        const skill = SEED_KIT_SKILLS.find((s) => s.id === id);
        expect(skill?.ownerCharacterId, `${id} owned by ${h}`).toBe(h);
      }
    }
  });

  it('each new hero has 7 kit skills with distinct slots 1..6 + an ultimate', () => {
    for (const h of NEW_HEROES) {
      const set = SEED_KIT_SKILLS.filter((s) => s.ownerCharacterId === h);
      expect(set.length, h).toBe(7);
      const slots = set.map((s) => s.slot).filter((n): n is number => n != null).sort();
      expect(slots, `${h} slots`).toEqual([1, 2, 3, 4, 5, 6]);
      expect(set.some((s) => s.skillCategory === 'ultimate'), `${h} ultimate`).toBe(true);
    }
  });

  it('combos reference resolvable kit skills', () => {
    for (const h of NEW_HEROES) {
      const kit = SEED_CHARACTER_KITS.find((k) => k.characterId === h)!;
      expect(kit.combos?.length, `${h} combos`).toBe(2);
      for (const c of kit.combos ?? []) {
        for (const step of c.inputSequence) expect(skillIds.has(step), `${c.id} input ${step}`).toBe(true);
        expect(skillIds.has(c.resultSkillId), `${c.id} result`).toBe(true);
        if (c.requiredPreviousSkillId) expect(skillIds.has(c.requiredPreviousSkillId), `${c.id} prev`).toBe(true);
      }
    }
  });

  it('new partner fusions reference kitted heroes and a cinematic effect', () => {
    const kitted = new Set(SEED_CHARACTER_KITS.map((k) => k.characterId));
    const newFusions = SEED_PARTNER_FUSIONS.filter((f) => ['fusion_jerome_bello_rhythm_wild', 'fusion_flip_jett_ricochet_rush', 'fusion_bello_chase_predator_recon'].includes(f.id));
    expect(newFusions.length).toBe(3);
    for (const f of newFusions) {
      expect(kitted.has(f.primaryCharacterId), `${f.id} primary`).toBe(true);
      expect(kitted.has(f.supportCharacterId), `${f.id} support`).toBe(true);
      expect(f.combo.cinematicEffectId.endsWith('_fx'), `${f.id} fx`).toBe(true);
    }
  });
});
