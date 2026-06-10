import { describe, it, expect } from 'vitest';
import { FlightObjectPool } from './FlightObjectPool';

describe('FlightObjectPool', () => {
  it('acquires (creating) and reuses released objects', () => {
    let made = 0;
    const pool = new FlightObjectPool<{ n: number }>(() => ({ n: made++ }));
    const a = pool.acquire('ring');
    expect(pool.activeCount('ring')).toBe(1);
    pool.release('ring', a);
    expect(pool.activeCount('ring')).toBe(0);
    expect(pool.idleCount('ring')).toBe(1);
    const b = pool.acquire('ring');
    expect(b).toBe(a); // reused, not newly created
    expect(made).toBe(1);
  });

  it('releaseAll returns every active object', () => {
    const pool = new FlightObjectPool<number>(() => Math.random());
    pool.acquire('a');
    pool.acquire('a');
    pool.acquire('b');
    expect(pool.activeCount()).toBe(3);
    pool.releaseAll();
    expect(pool.activeCount()).toBe(0);
    expect(pool.idleCount()).toBe(3);
  });
});
