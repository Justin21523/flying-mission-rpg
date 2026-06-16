import { describe, it, expect, beforeEach } from 'vitest';
import { playEffect } from '../../game/vfx/CinematicVfxDirector';
import { activeCombatFx, cleanupAllCinematic } from '../../game/vfx/cinematicVfxRuntime';
import { getModelAsset } from '../../data/modelLibrary';
import { SHOWCASE_ABILITY_IDS } from '../../data/cinematic-vfx/showcaseAbilities';
import { SEED_ARSENAL_ABILITIES } from '../../data/character-abilities/allCharacterAbilities';

// End-to-end-ish: driving the real playEffect must spawn MODEL layers (effectType model_*) into the live
// combat fx set, each with a resolvable GLB id. This is the contract that broke when the renderer silently
// dropped un-normalized models — it asserts the model path reaches the runtime with a real asset.
const modelFx = () => activeCombatFx.filter((fx) => fx.config.effectType.startsWith('model_'));
const ctx = { x: 0, y: 0, z: 0, heading: 0 };

describe('VfxModelSpawnContract', () => {
  beforeEach(() => cleanupAllCinematic());

  it('every showcase ability spawns >= 1 model layer with a resolvable GLB id', () => {
    for (const skillId of SHOWCASE_ABILITY_IDS) {
      cleanupAllCinematic();
      playEffect(`${skillId}_fx`, ctx);
      const models = modelFx();
      expect(models.length, `${skillId} model layers`).toBeGreaterThan(0);
      for (const fx of models) {
        const id = (fx.config.parameters.particleModelId as string | undefined) ?? fx.config.customModelPrefabId;
        expect(getModelAsset(id), `${skillId}: ${id}`).toBeDefined();
      }
    }
  });

  it('all 128 abilities spawn at least one resolvable model layer', () => {
    for (const ability of SEED_ARSENAL_ABILITIES) {
      cleanupAllCinematic();
      playEffect(`${ability.combat.skillDefinitionId}_fx`, ctx);
      const models = modelFx();
      expect(models.length, `${ability.id} has a model layer`).toBeGreaterThan(0);
      const allResolve = models.every((fx) => getModelAsset((fx.config.parameters.particleModelId as string | undefined) ?? fx.config.customModelPrefabId));
      expect(allResolve, `${ability.id} model ids resolve`).toBe(true);
    }
  });

  it('cleanup clears the live model fx', () => {
    playEffect('jett_overdrive_fx', ctx);
    expect(activeCombatFx.length).toBeGreaterThan(0);
    cleanupAllCinematic();
    expect(activeCombatFx.length).toBe(0);
  });
});
