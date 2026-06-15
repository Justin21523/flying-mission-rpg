import { describe, it, expect } from 'vitest';
import { SIGNATURE_LIBRARY, signaturePieces } from '../../data/cinematic-vfx/signatureEffectLibrary';
import { VFX_MODELS } from '../../data/cinematic-vfx/modelEffectPresets';
import { getModelAsset } from '../../data/modelLibrary';
import { CINEMATIC_LAYER_TYPES } from '../../types/cinematicVfxTypes';

describe('SignatureEffectLibrary', () => {
  it('every hero exposes >= 5 signature pieces', () => {
    for (const [cid, pieces] of Object.entries(SIGNATURE_LIBRARY)) {
      expect(Object.keys(pieces).length, cid).toBeGreaterThanOrEqual(5);
    }
  });

  it('pieces produce valid, typed cinematic layers', () => {
    const layerTypes = new Set<string>(CINEMATIC_LAYER_TYPES);
    for (const pieces of Object.values(SIGNATURE_LIBRARY)) {
      for (const make of Object.values(pieces)) {
        const layers = make('#33ccff');
        expect(layers.length).toBeGreaterThan(0);
        for (const l of layers) {
          expect(l.id).toBeTruthy();
          expect(layerTypes.has(l.layerType)).toBe(true);
          expect(l.durationSeconds).toBeGreaterThan(0);
          if (l.layerType === 'physics-object') expect(l.physicsObject).toBeDefined();
        }
      }
    }
  });

  it('all referenced VFX model ids resolve in the model library', () => {
    for (const id of Object.values(VFX_MODELS)) {
      expect(getModelAsset(id), id).toBeDefined();
    }
  });

  it('signaturePieces returns an empty map for unknown characters', () => {
    expect(signaturePieces('char_nobody')).toEqual({});
  });
});
