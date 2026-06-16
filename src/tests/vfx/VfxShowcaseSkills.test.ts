import { describe, it, expect } from 'vitest';
import { SEED_CINEMATIC_EFFECTS } from '../../data/character-abilities/allCharacterAbilities';
import { SHOWCASE_ABILITY_IDS } from '../../data/cinematic-vfx/showcaseAbilities';
import { isOwnHeroModel } from '../../data/cinematic-vfx/vfxModelCatalog';
import { getModelAsset } from '../../data/modelLibrary';
import type { CinematicEffectDefinition, CinematicLayerType } from '../../types/cinematicVfxTypes';

const byId = new Map(SEED_CINEMATIC_EFFECTS.map((e) => [e.id, e]));
const fx = (skillId: string): CinematicEffectDefinition => {
  const e = byId.get(`${skillId}_fx`);
  if (!e) throw new Error(`no effect for ${skillId}`);
  return e;
};
const hasLayer = (e: CinematicEffectDefinition, t: CinematicLayerType) => e.layers.some((l) => l.layerType === t);
const hasSig = (e: CinematicEffectDefinition, s: string) => (e.signatureObjectIds ?? []).includes(s);
const modelLayers = (e: CinematicEffectDefinition) => e.layers.filter((l) => l.layerType === 'model-component' && l.model?.modelAssetId);
const usesRealModel = (e: CinematicEffectDefinition) => modelLayers(e).some((l) => !!getModelAsset(l.model!.modelAssetId!));
const usesOwnModel = (e: CinematicEffectDefinition) => modelLayers(e).some((l) => isOwnHeroModel(e.characterId ?? '', l.model!.modelAssetId));

describe('VfxShowcaseSkills — real-model + character-distinct', () => {
  it('all 24 showcase ids resolve to an authored effect', () => {
    for (const id of SHOWCASE_ABILITY_IDS) expect(byId.has(`${id}_fx`), id).toBe(true);
  });

  it('every showcase effect uses a REAL GLB model AND the hero\'s OWN model + impact feedback', () => {
    for (const id of SHOWCASE_ABILITY_IDS) {
      const e = fx(id);
      expect(e.characterId, id).toBeTruthy();
      expect(e.motionLanguage, id).toBeTruthy();
      expect(usesRealModel(e), `${id} real model`).toBe(true);
      expect(usesOwnModel(e), `${id} own model`).toBe(true);
      expect(hasLayer(e, 'camera-feedback'), `${id} camera`).toBe(true);
    }
  });

  it('Jett rescue_rush streaks his own jet through wind + a rescue beacon', () => {
    const e = fx('jett_rescue_rush');
    expect(hasSig(e, 'jetAfterimage')).toBe(true);
    expect(hasSig(e, 'rescueWingmen')).toBe(true);
    expect(hasSig(e, 'windTunnel')).toBe(true);
    expect(hasLayer(e, 'fog-cloud')).toBe(true);
    expect(usesOwnModel(e)).toBe(true);
  });

  it('Jerome spotlight_dive spawns a dance troupe of his pose models under a spotlight', () => {
    const e = fx('jerome_spotlight_dive');
    expect(hasSig(e, 'danceTroupe')).toBe(true);
    expect(hasSig(e, 'spotlightStage')).toBe(true);
    expect(usesOwnModel(e)).toBe(true);
  });

  it('Paul shield_wall drops real traffic-barrier models + physics tiles', () => {
    const e = fx('paul_shield_wall');
    expect(hasSig(e, 'barrierWall')).toBe(true);
    expect(hasLayer(e, 'model-component')).toBe(true);
    expect(hasLayer(e, 'physics-object')).toBe(true);
  });

  it('Donnie build_cover assembles real tool/panel models (physics)', () => {
    const e = fx('donnie_build_cover');
    expect(hasSig(e, 'panelAssembly')).toBe(true);
    expect(hasLayer(e, 'physics-object')).toBe(true);
    expect(usesRealModel(e)).toBe(true);
  });

  it('Todd seismic_quake erupts real boulder models + rubble physics', () => {
    const e = fx('todd_seismic_quake');
    expect(hasSig(e, 'boulderErupt')).toBe(true);
    expect(hasLayer(e, 'physics-object')).toBe(true);
    expect(usesRealModel(e)).toBe(true);
  });

  it('Flip ricochet_ball bounces a real ball/torus model (physics)', () => {
    const e = fx('flip_ricochet_ball');
    expect(hasSig(e, 'sportBall')).toBe(true);
    expect(hasLayer(e, 'physics-object')).toBe(true);
    expect(usesRealModel(e)).toBe(true);
  });

  it('Bello animal_rush summons real lion/cat yokai models', () => {
    const e = fx('bello_animal_rush');
    expect(hasSig(e, 'lionPride')).toBe(true);
    expect(hasLayer(e, 'model-component')).toBe(true);
    expect(usesRealModel(e)).toBe(true);
  });

  it('Chase weakpoint_scan deploys real drone/radar models + own holo-decoy', () => {
    const e = fx('chase_weakpoint_scan');
    expect(hasSig(e, 'radarScan')).toBe(true);
    expect(hasSig(e, 'holoSelf')).toBe(true);
    expect(usesOwnModel(e)).toBe(true);
  });
});
