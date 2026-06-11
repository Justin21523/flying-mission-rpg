import { describe, it, expect } from 'vitest';
import { clampNum } from './clampNum';

describe('clampNum', () => {
  it('passes through when no bounds', () => {
    expect(clampNum(999)).toBe(999);
    expect(clampNum(-5)).toBe(-5);
  });
  it('clamps below min / above max', () => {
    expect(clampNum(-2, 0, 1)).toBe(0);
    expect(clampNum(5, 0, 1)).toBe(1);
    expect(clampNum(0.5, 0, 1)).toBe(0.5);
  });
  it('only-min and only-max bounds', () => {
    expect(clampNum(-3, 0)).toBe(0);
    expect(clampNum(3, 0)).toBe(3);
    expect(clampNum(200, undefined, 120)).toBe(120);
    expect(clampNum(50, undefined, 120)).toBe(50);
  });
  it('NaN falls back to min (or 0)', () => {
    expect(clampNum(NaN, 2, 9)).toBe(2);
    expect(clampNum(NaN)).toBe(0);
  });
});
