import { describe, it, expect } from 'vitest';
import { nextSpeed, isStalling } from './flightModel';
import { DEFAULT_FLIGHT_TUNING } from '../../data/game/flightTuning';

const T = DEFAULT_FLIGHT_TUNING;

describe('nextSpeed', () => {
  it('accelerates toward max under throttle', () => {
    const s = nextSpeed(0, 1, T, 1, 1);
    expect(s).toBeGreaterThan(0);
    expect(s).toBeLessThanOrEqual(T.maxSpeed);
  });
  it('never exceeds max×mult', () => {
    let s = 0;
    for (let i = 0; i < 200; i++) s = nextSpeed(s, 1, T, 1.5, 0.1);
    expect(s).toBeLessThanOrEqual(T.maxSpeed * 1.5 + 1e-6);
  });
  it('coasts toward cruise with no input', () => {
    const s = nextSpeed(T.maxSpeed, 0, T, 1, 5); // big dt → reaches cruise
    expect(s).toBeCloseTo(T.cruiseSpeed, 1);
  });
  it('never goes negative when braking', () => {
    expect(nextSpeed(2, -1, T, 1, 5)).toBeGreaterThanOrEqual(0);
  });
});

describe('isStalling', () => {
  it('true below stall speed', () => {
    expect(isStalling(T.stallSpeed - 1, T, 1)).toBe(true);
  });
  it('false above stall speed', () => {
    expect(isStalling(T.stallSpeed + 1, T, 1)).toBe(false);
  });
});
