import { describe, it, expect } from 'vitest';
import { validateCinematicEffect } from '../../game/vfx/CinematicVfxValidation';
import { SEED_CINEMATIC_EFFECTS } from '../../data/character-abilities/allCharacterAbilities';
import { getModelAsset } from '../../data/modelLibrary';

const modelExists = (id: string) => !!getModelAsset(id);

describe('CinematicVfxValidation', () => {
  it('every one of the 128 cinematic effects validates + all model layers resolve', () => {
    expect(SEED_CINEMATIC_EFFECTS.length).toBe(128);
    for (const e of SEED_CINEMATIC_EFFECTS) {
      const r = validateCinematicEffect(e, modelExists);
      expect(r.ok, `${e.id}: ${r.errors.join(', ')}`).toBe(true);
      // no model-missing warnings → all referenced models exist
      const missing = r.warnings.filter((w) => w.includes('missing'));
      expect(missing, `${e.id}: ${missing.join(', ')}`).toEqual([]);
    }
  });

  it('every effect is model-first (not particle-only)', () => {
    for (const e of SEED_CINEMATIC_EFFECTS) {
      const r = validateCinematicEffect(e, modelExists);
      expect(r.warnings.some((w) => w.includes('particle-only')), e.id).toBe(false);
    }
  });

  it('rejects an effect with no layers and a non-positive duration', () => {
    expect(validateCinematicEffect({ ...SEED_CINEMATIC_EFFECTS[0], layers: [] }).ok).toBe(false);
    expect(validateCinematicEffect({ ...SEED_CINEMATIC_EFFECTS[0], timeline: { totalDurationSeconds: 0 } }).ok).toBe(false);
  });
});
