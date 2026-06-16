import { describe, it, expect, beforeEach } from 'vitest';
import { spawnCloneAbility, activeCloneCount, clonePoolCapacity, cleanupAllClonesForPhaseChange, cleanupAllClonesForCaster } from '../../game/vfx/CloneAbilityRuntime';
import { cleanupAllCinematic } from '../../game/vfx/cinematicVfxRuntime';

describe('CloneAbilityRuntime (Batch F.7)', () => {
  beforeEach(() => { cleanupAllClonesForPhaseChange(); cleanupAllCinematic(); });

  it('spawns a clone ability and tracks it as active', () => {
    const id = spawnCloneAbility('char_jett', 'jett_afterimage_wingman');
    expect(id).toBeTruthy();
    expect(activeCloneCount()).toBeGreaterThanOrEqual(1);
  });

  it('returns null for an unknown clone ability', () => {
    expect(spawnCloneAbility('char_jett', 'not_a_clone')).toBeNull();
  });

  it('cleanupAllClonesForPhaseChange clears every active clone', () => {
    spawnCloneAbility('char_jett', 'jett_overdrive_echo');
    spawnCloneAbility('char_chase', 'chase_surveillance_phantom');
    expect(activeCloneCount()).toBeGreaterThan(0);
    cleanupAllClonesForPhaseChange();
    expect(activeCloneCount()).toBe(0);
  });

  it('never exceeds the active-instance pool capacity', () => {
    for (let i = 0; i < clonePoolCapacity() + 8; i++) spawnCloneAbility('char_jett', 'jett_afterimage_wingman');
    expect(activeCloneCount()).toBeLessThanOrEqual(clonePoolCapacity());
  });

  it('cleanupAllClonesForCaster removes only that caster\'s clones', () => {
    cleanupAllClonesForPhaseChange();
    spawnCloneAbility('char_jett', 'jett_afterimage_wingman', { casterId: 'char_jett' });
    spawnCloneAbility('char_paul', 'paul_patrol_partner', { casterId: 'char_paul' });
    const before = activeCloneCount();
    expect(before).toBeGreaterThanOrEqual(2);
    cleanupAllClonesForCaster('char_jett');
    expect(activeCloneCount()).toBe(before - 1);
  });
});
