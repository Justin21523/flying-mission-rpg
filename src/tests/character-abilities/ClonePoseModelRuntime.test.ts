import { describe, it, expect } from 'vitest';
import { clonePoseModelSet } from '../../game/vfx/ClonePoseModelPresets';
import { resolvePoseOrFallback, poseSetResolves, resolvedPoseList, poseModelExists } from '../../game/vfx/ClonePoseModelRuntime';
import { ARSENAL_CHARACTER_IDS } from '../../data/character-abilities/allCharacterAbilities';
import { CLONE_TYPES } from '../../types/cloneAbilityTypes';

describe('ClonePoseModelRuntime (Batch F.7)', () => {
  it('resolves a real, renderable pose set for every hero + clone type', () => {
    for (const cid of ARSENAL_CHARACTER_IDS) {
      for (const ct of CLONE_TYPES) {
        const set = clonePoseModelSet(cid, ct);
        expect(set.fallbackModelId, `${cid}/${ct} fallback`).toBeTruthy();
        expect(poseSetResolves(set), `${cid}/${ct} resolves`).toBe(true);
        expect(poseModelExists(set.fallbackModelId), `${cid}/${ct} fallback exists`).toBe(true);
      }
    }
  });

  it('a missing pose falls back without throwing', () => {
    const set = clonePoseModelSet('char_jett', 'attack-double');
    const broken = { ...set, idlePoseModelId: 'does/not/exist', actionPoseModelId: 'does/not/exist-2' };
    expect(() => resolvePoseOrFallback(broken, 'idle')).not.toThrow();
    expect(resolvePoseOrFallback(broken, 'idle')).toBe(broken.fallbackModelId);
  });

  it('resolvedPoseList returns only real model ids', () => {
    const set = clonePoseModelSet('char_bello', 'support-double');
    const list = resolvedPoseList(set);
    expect(list.length).toBeGreaterThan(0);
    for (const id of list) expect(poseModelExists(id), id).toBe(true);
  });
});
