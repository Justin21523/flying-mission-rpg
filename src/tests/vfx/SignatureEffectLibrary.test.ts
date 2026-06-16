import { describe, it, expect } from 'vitest';
import { SIGNATURE_LIBRARY, signaturePieces } from '../../data/cinematic-vfx/signatureEffectLibrary';
import { getModelAsset } from '../../data/modelLibrary';
import { isOwnHeroModel } from '../../data/cinematic-vfx/vfxModelCatalog';
import { CINEMATIC_LAYER_TYPES } from '../../types/cinematicVfxTypes';

// collect every model id a hero's pieces reference (across all pieces).
function heroModelIds(cid: string): string[] {
  const ids = new Set<string>();
  for (const make of Object.values(SIGNATURE_LIBRARY[cid])) {
    for (const l of make('#33ccff')) {
      if (l.layerType === 'model-component' && l.model?.modelAssetId) ids.add(l.model.modelAssetId);
    }
  }
  return [...ids];
}

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

  it('every referenced model id resolves; each hero uses >= 3 distinct real GLBs', () => {
    for (const cid of Object.keys(SIGNATURE_LIBRARY)) {
      const ids = heroModelIds(cid);
      for (const id of ids) expect(getModelAsset(id), `${cid}:${id}`).toBeDefined();
      expect(ids.length, `${cid} distinct models`).toBeGreaterThanOrEqual(3);
    }
  });

  it('every hero has >= 1 piece using their OWN super-wings model', () => {
    for (const cid of Object.keys(SIGNATURE_LIBRARY)) {
      const ownCount = heroModelIds(cid).filter((id) => isOwnHeroModel(cid, id)).length;
      expect(ownCount, `${cid} own-model pieces`).toBeGreaterThanOrEqual(1);
    }
  });

  it('arsenal uses a broad set of real models (>= 30 distinct ids)', () => {
    const all = new Set<string>();
    for (const cid of Object.keys(SIGNATURE_LIBRARY)) heroModelIds(cid).forEach((id) => all.add(id));
    expect(all.size).toBeGreaterThanOrEqual(30);
  });

  it('signaturePieces returns an empty map for unknown characters', () => {
    expect(signaturePieces('char_nobody')).toEqual({});
  });
});
