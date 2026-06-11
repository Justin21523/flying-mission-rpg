import { describe, it, expect } from 'vitest';
import { crossedMilestones } from './flightMilestones';

describe('crossedMilestones', () => {
  it('returns milestones in (prevU, u]', () => {
    expect(crossedMilestones(0.2, 0.55, 0.25)).toEqual([0.25, 0.5]);
    expect(crossedMilestones(0.5, 0.5, 0.25)).toEqual([]); // no advance
    expect(crossedMilestones(0, 1, 0.25)).toEqual([0.25, 0.5, 0.75]); // excludes 1.0
  });
  it('no milestones when none crossed', () => {
    expect(crossedMilestones(0.26, 0.49, 0.25)).toEqual([]);
  });
  it('step <= 0 → empty', () => {
    expect(crossedMilestones(0, 1, 0)).toEqual([]);
  });
});
