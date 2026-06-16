import { describe, it, expect } from 'vitest';
import { SEED_CINEMATIC_EFFECTS } from '../../data/character-abilities/allCharacterAbilities';
import type { CinematicLayerType } from '../../types/cinematicVfxTypes';

// Batch F.6 — every ability effect must COMBINE model + particle + geometry/fog (never particle-only, never
// model-only). authoredEffect guarantees this; this is the regression guard.
const MODEL: ReadonlySet<CinematicLayerType> = new Set(['model-component', 'model-fragment', 'object-assembly']);
const PARTICLE: ReadonlySet<CinematicLayerType> = new Set(['particle-burst', 'particle-trail']);
const GEOM_OR_FOG: ReadonlySet<CinematicLayerType> = new Set([
  'geometry-mesh', 'shield-panel', 'scan-overlay', 'lock-line', 'ground-marker', 'energy-field',
  'fog-cloud', 'smoke-ring', 'dust-cloud',
]);

describe('EffectLayerCompleteness (Batch F.6)', () => {
  it('every one of the 128 effects has a model + particle + geometry/fog layer', () => {
    expect(SEED_CINEMATIC_EFFECTS).toHaveLength(128);
    for (const e of SEED_CINEMATIC_EFFECTS) {
      const types = e.layers.map((l) => l.layerType);
      expect(types.some((t) => MODEL.has(t)), `${e.id} model layer`).toBe(true);
      expect(types.some((t) => PARTICLE.has(t)), `${e.id} particle layer`).toBe(true);
      expect(types.some((t) => GEOM_OR_FOG.has(t)), `${e.id} geometry/fog layer`).toBe(true);
    }
  });

  it('every effect carries a camera-feedback layer', () => {
    for (const e of SEED_CINEMATIC_EFFECTS) {
      expect(e.layers.some((l) => l.layerType === 'camera-feedback'), `${e.id} camera feedback`).toBe(true);
    }
  });
});
