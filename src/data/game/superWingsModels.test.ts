import { describe, it, expect } from 'vitest';
import { SUPER_WINGS_MODELS, poseModelsFor, heroPoseAssetIds, id } from './superWingsModels';

const HEROES = Object.keys(SUPER_WINGS_MODELS);

describe('super-wings model catalog', () => {
  it('covers all 8 heroes', () => {
    expect(HEROES).toHaveLength(8);
    expect(HEROES).toEqual(expect.arrayContaining(['char_jett', 'char_jerome', 'char_donnie', 'char_paul', 'char_bello', 'char_chase', 'char_flip', 'char_todd']));
  });

  it('poseModelsFor returns the transformer + airplane + poses with unique ids and super-wings asset ids', () => {
    for (const h of HEROES) {
      const list = poseModelsFor(h);
      expect(list.length).toBeGreaterThan(0); // at least the transformer
      const ids = list.map((p) => p.id);
      expect(new Set(ids).size).toBe(ids.length); // ids unique (handles same-tidy filename collisions)
      for (const pm of list) {
        expect(pm.assetId.startsWith('super-wings/')).toBe(true);
        expect(pm.label.length).toBeGreaterThan(0);
      }
      // first entry is the robot/transformer
      expect(list[0].assetId).toBe(id(SUPER_WINGS_MODELS[h].transformer));
    }
  });

  it('heroPoseAssetIds returns prefixed pose ids', () => {
    expect(heroPoseAssetIds('char_flip').every((a) => a.startsWith('super-wings/'))).toBe(true);
    expect(heroPoseAssetIds('char_jett')).toEqual([]); // Jett has only a transformer
  });
});
