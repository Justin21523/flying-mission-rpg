import { describe, it, expect } from 'vitest';
import { SEED_CLONE_ABILITIES } from '../../data/character-abilities/allCharacterAbilities';
import { validateCloneAbility } from '../../game/vfx/CloneAbilityValidation';

describe('CloneAbilityValidation (Batch F.7)', () => {
  it('every one of the 32 clone abilities validates', () => {
    expect(SEED_CLONE_ABILITIES.length).toBe(32);
    for (const def of SEED_CLONE_ABILITIES) {
      const r = validateCloneAbility(def);
      expect(r.ok, `${def.id}: ${r.errors.join(', ')}`).toBe(true);
    }
  });

  it('every clone has a pose set + a complete state timeline + a gameplay effect', () => {
    for (const def of SEED_CLONE_ABILITIES) {
      expect(def.poseModelSet.fallbackModelId, `${def.id} fallback`).toBeTruthy();
      const states = new Set(def.stateTimeline.map((k) => k.state));
      expect(states.has('spawn'), `${def.id} spawn`).toBe(true);
      expect(states.has('pose-switch'), `${def.id} pose-switch`).toBe(true);
      expect(states.has('dissolve'), `${def.id} dissolve`).toBe(true);
      expect(states.has('cleanup'), `${def.id} cleanup`).toBe(true);
      expect(Object.keys(def.gameplayEffect).length, `${def.id} gameplay`).toBeGreaterThan(0);
      expect(def.maxCloneCount, `${def.id} count`).toBeGreaterThan(0);
      expect(def.durationSeconds, `${def.id} duration`).toBeGreaterThan(0);
      expect(def.visualConfig.modelScaleMultiplier, `${def.id} scale`).toBeGreaterThan(0);
    }
  });

  it('rejects a clone with an empty state timeline', () => {
    const bad = { ...SEED_CLONE_ABILITIES[0], stateTimeline: [] };
    expect(validateCloneAbility(bad).ok).toBe(false);
  });

  it('rejects a clone with a non-positive duration / count', () => {
    expect(validateCloneAbility({ ...SEED_CLONE_ABILITIES[0], durationSeconds: 0 }).ok).toBe(false);
    expect(validateCloneAbility({ ...SEED_CLONE_ABILITIES[0], maxCloneCount: 0 }).ok).toBe(false);
  });
});
