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
});
