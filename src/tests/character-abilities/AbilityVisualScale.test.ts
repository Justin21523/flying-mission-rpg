import { describe, it, expect } from 'vitest';
import { SEED_ARSENAL_ABILITIES, abilitiesForCharacter, ARSENAL_CHARACTER_IDS } from '../../data/character-abilities/allCharacterAbilities';
import { MODEL_SCALE_PRESETS, presetForCategory } from '../../data/cinematic-vfx/modelScalePresets';

// Batch F.6 — tiered model scale: every ability has a visualScale; ultimates read larger than basic attacks;
// defenses are at least medium. The on-screen model size comes from this tier (× the normalized base).
describe('AbilityVisualScale (Batch F.6)', () => {
  it('every ability has a positive model scale matching its category tier', () => {
    for (const a of SEED_ARSENAL_ABILITIES) {
      expect(a.visualScale, a.id).toBeTruthy();
      expect(a.visualScale!.modelScaleMultiplier, a.id).toBeGreaterThan(0);
      expect(a.visualScale!.modelScalePreset, a.id).toBe(presetForCategory(a.abilityCategory));
      expect(a.visualScale!.modelScaleMultiplier, a.id).toBe(MODEL_SCALE_PRESETS[presetForCategory(a.abilityCategory)]);
    }
  });

  it('per hero: ultimate scale > basic-attack scale, and defense >= medium', () => {
    for (const cid of ARSENAL_CHARACTER_IDS) {
      const a = abilitiesForCharacter(cid);
      const attack = a.find((x) => x.abilitySlot === 'attack-1')!;
      const defense = a.find((x) => x.abilityCategory === 'defense')!;
      const ult = a.find((x) => x.abilityCategory === 'ultimate')!;
      expect(ult.visualScale!.modelScaleMultiplier, `${cid} ult>attack`).toBeGreaterThan(attack.visualScale!.modelScaleMultiplier);
      expect(defense.visualScale!.modelScaleMultiplier, `${cid} defense>=medium`).toBeGreaterThanOrEqual(MODEL_SCALE_PRESETS.medium);
    }
  });

  it('ultimate tier is the largest preset', () => {
    expect(MODEL_SCALE_PRESETS.ultimate).toBeGreaterThan(MODEL_SCALE_PRESETS.hero);
    expect(MODEL_SCALE_PRESETS.hero).toBeGreaterThan(MODEL_SCALE_PRESETS.large);
    expect(MODEL_SCALE_PRESETS.large).toBeGreaterThan(MODEL_SCALE_PRESETS.medium);
  });
});
