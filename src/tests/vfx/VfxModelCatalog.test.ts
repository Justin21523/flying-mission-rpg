import { describe, it, expect } from 'vitest';
import { pickModel, heroModels, HERO_MODELS, THEME_MODELS, isOwnHeroModel } from '../../data/cinematic-vfx/vfxModelCatalog';
import { getModelAsset } from '../../data/modelLibrary';

const resolves = (id: string | undefined) => !!id && !!getModelAsset(id);

describe('VfxModelCatalog', () => {
  it('pickModel resolves regardless of +/space separators', () => {
    expect(resolves(pickModel('Jett', 'airplane'))).toBe(true); // file uses '+'
    expect(resolves(pickModel('Donnie', 'airplane'))).toBe(true); // file uses spaces
    expect(resolves(pickModel('red', 'fire', 'lion'))).toBe(true);
    expect(resolves(pickModel('traffic barrier'))).toBe(true);
  });

  it('every hero resolves their own airplane / pose / transformer + pose set', () => {
    for (const [cid, set] of Object.entries(HERO_MODELS)) {
      expect(resolves(set.airplane), `${cid} airplane`).toBe(true);
      expect(resolves(set.pose), `${cid} pose`).toBe(true);
      expect(resolves(set.transformer), `${cid} transformer`).toBe(true);
      expect(set.poses.length, `${cid} poses`).toBeGreaterThanOrEqual(1);
      expect(set.poses.every(resolves)).toBe(true);
      expect(set.all.every((id) => isOwnHeroModel(cid, id))).toBe(true);
    }
  });

  it('Jerome has many pose variants (dance troupe source)', () => {
    expect(heroModels('Jerome').poses.length).toBeGreaterThanOrEqual(8);
  });

  it('all curated theme models resolve to real assets', () => {
    const flat: (string | undefined)[] = [];
    for (const group of Object.values(THEME_MODELS)) {
      for (const v of Object.values(group)) {
        if (Array.isArray(v)) flat.push(...v); else flat.push(v);
      }
    }
    const missing = flat.filter((id) => id !== undefined && !resolves(id));
    expect(missing).toEqual([]);
    // and the key ones must be present (not undefined)
    expect(resolves(THEME_MODELS.paul.trafficBarrier)).toBe(true);
    expect(resolves(THEME_MODELS.donnie.forklift)).toBe(true);
    expect(resolves(THEME_MODELS.todd.mineCart)).toBe(true);
    expect(resolves(THEME_MODELS.flip.torus)).toBe(true);
    expect(THEME_MODELS.bello.lions.length).toBeGreaterThanOrEqual(3);
    expect(THEME_MODELS.chase.drones.length).toBeGreaterThanOrEqual(2);
  });
});
