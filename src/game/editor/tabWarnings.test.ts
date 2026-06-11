import { describe, it, expect } from 'vitest';
import { sumWarnings } from './tabWarnings';

describe('sumWarnings', () => {
  it('totals the validator output lengths', () => {
    const items = [{ bad: 2 }, { bad: 0 }, { bad: 1 }];
    expect(sumWarnings(items, (i) => Array.from({ length: i.bad }))).toBe(3);
  });
  it('zero when everything is clean', () => {
    expect(sumWarnings([{ x: 1 }, { x: 2 }], () => [])).toBe(0);
  });
  it('empty list → 0', () => {
    expect(sumWarnings([], () => ['warn'])).toBe(0);
  });
});
