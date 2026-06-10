import { describe, it, expect } from 'vitest';
import { pickEvent } from './flightEventModel';
import type { FlightEventDef } from '../../../types/game/flightEvent';

const ev = (id: string, weight: number, minGapSec: number): FlightEventDef => ({
  id,
  kind: 'collectible',
  label: id,
  weight,
  minGapSec,
  lateralRange: 4,
  color: '#fff',
  size: 1,
  durationSec: 5,
  sourceConfidence: 'GameAdaptation',
});

describe('pickEvent', () => {
  const pool = [ev('a', 1, 4), ev('b', 1, 4)];

  it('returns null when every event is on cooldown', () => {
    expect(pickEvent(pool, 10, { a: 9, b: 9 }, () => 0.5)).toBeNull();
  });
  it('returns an eligible event past its cooldown', () => {
    const e = pickEvent(pool, 100, { a: 0, b: 0 }, () => 0.1);
    expect(e).not.toBeNull();
    expect(['a', 'b']).toContain(e!.id);
  });
  it('skips the event still cooling down', () => {
    // a cooled down (last 0, now 100), b just spawned (last 99, now 100 < 4 gap) → must pick a
    expect(pickEvent(pool, 100, { a: 0, b: 99 }, () => 0.99)!.id).toBe('a');
  });
  it('weights the selection (heavier wins the high roll)', () => {
    const weighted = [ev('light', 1, 0), ev('heavy', 9, 0)];
    expect(pickEvent(weighted, 100, {}, () => 0.9)!.id).toBe('heavy');
  });

  it('only spawns kinds the segment allows', () => {
    const a = { ...ev('a', 1, 0), kind: 'collectible' as const };
    const b = { ...ev('b', 1, 0), kind: 'stunt_ring' as const };
    expect(pickEvent([a, b], 100, {}, () => 0.1, { allowedKinds: ['stunt_ring'] })!.kind).toBe('stunt_ring');
  });

  it('respects the route-progress window', () => {
    const a = { ...ev('a', 1, 0), minRouteProgress: 0.5, maxRouteProgress: 1 };
    expect(pickEvent([a], 100, {}, () => 0.1, { routeU: 0.2 })).toBeNull();
    expect(pickEvent([a], 100, {}, () => 0.1, { routeU: 0.7 })).not.toBeNull();
  });

  it('respects canOverlapWith vs. active kinds', () => {
    const storm = { ...ev('storm', 1, 0), kind: 'storm' as const, canOverlapWith: ['radio' as const] };
    expect(pickEvent([storm], 100, {}, () => 0.1, { activeKinds: ['birds'] })).toBeNull();
    expect(pickEvent([storm], 100, {}, () => 0.1, { activeKinds: ['radio'] })).not.toBeNull();
  });

  it('caps blocking events', () => {
    const blk = { ...ev('blk', 1, 0), blocking: true };
    expect(pickEvent([blk], 100, {}, () => 0.1, { blockingActiveCount: 1, maxBlocking: 1 })).toBeNull();
    expect(pickEvent([blk], 100, {}, () => 0.1, { blockingActiveCount: 0, maxBlocking: 1 })).not.toBeNull();
  });
});
