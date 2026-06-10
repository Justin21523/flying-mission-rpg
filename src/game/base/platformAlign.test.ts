import { describe, it, expect } from 'vitest';
import { withinRadius } from './platformAlign';

describe('withinRadius', () => {
  it('is true at the centre', () => {
    expect(withinRadius(0, 0, 0, 0, 1.5)).toBe(true);
  });
  it('is true on the boundary', () => {
    expect(withinRadius(3, 0, 0, 0, 3)).toBe(true);
  });
  it('is false outside the radius', () => {
    expect(withinRadius(5, 0, 0, 0, 3)).toBe(false);
  });
  it('ignores the Y axis (XZ only)', () => {
    expect(withinRadius(0.5, 0.5, 0, 0, 1)).toBe(true);
  });
});
