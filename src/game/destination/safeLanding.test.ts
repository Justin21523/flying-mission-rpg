import { describe, it, expect } from 'vitest';
import { evaluateLanding } from './safeLanding';
import type { LandingZoneInput } from './safeLanding';

const ZONES: LandingZoneInput[] = [
  { id: 'pad', x: 0, z: 0, radius: 9, kind: 'landing_zone' },
  { id: 'plaza', x: 16, z: 8, radius: 12, kind: 'safe_zone' },
];
const BOUNDARY = { x: 90, z: 90 };

describe('evaluateLanding', () => {
  it('slow touchdown inside the landing zone is perfect/safe', () => {
    const e = evaluateLanding({ x: 1, z: 1, verticalSpeed: 2, horizontalSpeed: 1, zones: ZONES, boundaryHalf: BOUNDARY });
    expect(e.safe).toBe(true);
    expect(e.quality).toBe('perfect');
    expect(e.zoneId).toBe('pad');
  });

  it('high-speed impact is unsafe with reasons', () => {
    const e = evaluateLanding({ x: 0, z: 0, verticalSpeed: 20, horizontalSpeed: 1, zones: ZONES, boundaryHalf: BOUNDARY });
    expect(e.safe).toBe(false);
    expect(e.quality).toBe('unsafe');
    expect(e.reasons.some((r) => r.includes('too fast'))).toBe(true);
  });

  it('landing outside the boundary is unsafe', () => {
    const e = evaluateLanding({ x: 200, z: 0, verticalSpeed: 2, horizontalSpeed: 1, zones: ZONES, boundaryHalf: BOUNDARY });
    expect(e.safe).toBe(false);
    expect(e.reasons.some((r) => r.includes('boundary'))).toBe(true);
  });

  it('off-zone but slow is rough with a reason', () => {
    const e = evaluateLanding({ x: 50, z: 50, verticalSpeed: 4, horizontalSpeed: 2, zones: ZONES, boundaryHalf: BOUNDARY });
    expect(e.safe).toBe(true);
    expect(e.quality).toBe('rough');
    expect(e.reasons.some((r) => r.includes('Not over'))).toBe(true);
  });
});
