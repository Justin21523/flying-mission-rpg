import { describe, it, expect, beforeEach } from 'vitest';
import { acquire, release, canAcquire, activeCount, poolCapacity, resetPool } from '../../game/vfx/CinematicEffectPool';

describe('CinematicEffectPool', () => {
  beforeEach(() => resetPool());

  it('acquires + releases within capacity', () => {
    expect(activeCount()).toBe(0);
    expect(acquire()).toBe(true);
    expect(activeCount()).toBe(1);
    release();
    expect(activeCount()).toBe(0);
  });

  it('refuses to acquire past capacity', () => {
    for (let i = 0; i < poolCapacity(); i++) expect(acquire()).toBe(true);
    expect(canAcquire()).toBe(false);
    expect(acquire()).toBe(false);
  });

  it('reset clears the active count', () => {
    acquire(); acquire();
    resetPool();
    expect(activeCount()).toBe(0);
  });
});
