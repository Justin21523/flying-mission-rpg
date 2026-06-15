import { describe, it, expect, beforeEach } from 'vitest';
import { acquire, release, canAcquire, activeCount, poolCapacity, resetPool } from '../../game/vfx/physics/PhysicsVfxObjectPool';

describe('PhysicsVfxObjectPool', () => {
  beforeEach(() => resetPool());

  it('acquires + releases batches within capacity', () => {
    expect(activeCount()).toBe(0);
    expect(acquire(10)).toBe(true);
    expect(activeCount()).toBe(10);
    release(4);
    expect(activeCount()).toBe(6);
  });

  it('refuses to acquire past the cap', () => {
    expect(acquire(poolCapacity())).toBe(true);
    expect(canAcquire(1)).toBe(false);
    expect(acquire(1)).toBe(false);
    expect(activeCount()).toBe(poolCapacity());
  });

  it('release never goes negative', () => {
    acquire(3);
    release(10);
    expect(activeCount()).toBe(0);
  });

  it('reset clears the active count', () => {
    acquire(20);
    resetPool();
    expect(activeCount()).toBe(0);
  });
});
