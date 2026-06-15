import { describe, it, expect } from 'vitest';
import { SEED_CINEMATIC_EFFECTS } from '../../data/character-abilities/allCharacterAbilities';
import { SHOWCASE_ABILITY_IDS } from '../../data/cinematic-vfx/showcaseAbilities';
import type { CinematicEffectDefinition, CinematicLayerType } from '../../types/cinematicVfxTypes';

const byId = new Map(SEED_CINEMATIC_EFFECTS.map((e) => [e.id, e]));
const fx = (skillId: string): CinematicEffectDefinition => {
  const e = byId.get(`${skillId}_fx`);
  if (!e) throw new Error(`no effect for ${skillId}`);
  return e;
};
const hasLayer = (e: CinematicEffectDefinition, t: CinematicLayerType) => e.layers.some((l) => l.layerType === t);
const hasSig = (e: CinematicEffectDefinition, s: string) => (e.signatureObjectIds ?? []).includes(s);

describe('VfxShowcaseSkills — content is character-distinct', () => {
  it('all 24 showcase ids resolve to an authored effect', () => {
    for (const id of SHOWCASE_ABILITY_IDS) expect(byId.has(`${id}_fx`), id).toBe(true);
  });

  it('every showcase effect carries character + motion metadata + impact feedback', () => {
    for (const id of SHOWCASE_ABILITY_IDS) {
      const e = fx(id);
      expect(e.characterId).toBeTruthy();
      expect(e.motionLanguage).toBeTruthy();
      expect((e.signatureObjectIds ?? []).length).toBeGreaterThan(0);
      expect(hasLayer(e, 'camera-feedback')).toBe(true);
    }
  });

  it('Jett rescue_rush has spline + afterimage + wind fog + rescue marker', () => {
    const e = fx('jett_rescue_rush');
    expect(hasSig(e, 'speedSplineRoute')).toBe(true);
    expect(hasSig(e, 'afterimageBurst')).toBe(true);
    expect(hasSig(e, 'windTunnelFog')).toBe(true);
    expect(hasSig(e, 'rescueLockMarker')).toBe(true);
    expect(hasLayer(e, 'fog-cloud')).toBe(true);
  });

  it('Jerome spotlight_dive uses the spotlight cone', () => {
    expect(hasSig(fx('jerome_spotlight_dive'), 'spotlightCone')).toBe(true);
  });

  it('Paul shield_wall raises physical shield tiles', () => {
    const e = fx('paul_shield_wall');
    expect(hasSig(e, 'policeShieldPanel')).toBe(true);
    expect(hasLayer(e, 'physics-object') || hasLayer(e, 'shield-panel')).toBe(true);
  });

  it('Donnie build_cover assembles metal panels (physics objects)', () => {
    const e = fx('donnie_build_cover');
    expect(hasSig(e, 'metalPanelAssembly')).toBe(true);
    expect(hasLayer(e, 'physics-object')).toBe(true);
  });

  it('Todd seismic_quake erupts rubble (physics objects)', () => {
    const e = fx('todd_seismic_quake');
    expect(hasSig(e, 'rockRubble')).toBe(true);
    expect(hasLayer(e, 'physics-object')).toBe(true);
  });

  it('Flip ricochet_ball spawns a bouncing ball (physics object)', () => {
    const e = fx('flip_ricochet_ball');
    expect(hasSig(e, 'sportBall')).toBe(true);
    expect(hasLayer(e, 'physics-object')).toBe(true);
  });

  it('Bello animal_rush summons an animal spirit model', () => {
    const e = fx('bello_animal_rush');
    expect(hasSig(e, 'animalSpirit')).toBe(true);
    expect(hasLayer(e, 'model-component')).toBe(true);
  });

  it('Chase weakpoint_scan exposes a weakpoint marker', () => {
    expect(hasSig(fx('chase_weakpoint_scan'), 'weakpointRing')).toBe(true);
  });
});
