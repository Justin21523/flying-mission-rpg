import { describe, it, expect } from 'vitest';
import { SEED_ELEMENT_REACTIONS } from './elementReactions';
import { SEED_KIT_EFFECTS } from '../character-skills/characterSkillEffects';

// Wave 5 — every reaction's vfxEffectId must resolve to a real combat effect so the burst actually renders.
describe('Wave 5 reaction VFX', () => {
  const effectIds = new Set(SEED_KIT_EFFECTS.map((e) => e.id));

  it('ships the 4 reaction effects', () => {
    for (const id of ['fx_shatter_burst', 'fx_overload_blast', 'fx_conduct_chain', 'fx_meltdown_implosion']) {
      expect(effectIds.has(id), id).toBe(true);
    }
  });

  it('every reaction (enabled or not) references a resolvable vfxEffectId', () => {
    for (const r of SEED_ELEMENT_REACTIONS) {
      expect(r.vfxEffectId, `${r.id} has a vfx`).toBeTruthy();
      expect(effectIds.has(r.vfxEffectId!), `${r.id} → ${r.vfxEffectId}`).toBe(true);
    }
  });
});
