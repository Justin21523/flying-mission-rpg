import { describe, it, expect } from 'vitest';
import { validateTimeline } from './transformationValidation';
import { makeTimeline } from './testFixture';

describe('validateTimeline', () => {
  it('passes a well-formed timeline', () => {
    expect(validateTimeline(makeTimeline())).toEqual([]);
  });

  it('fails when a stage extends past total duration', () => {
    const errs = validateTimeline(makeTimeline({ stages: [{ id: 'x', type: 'finish-pose', startTime: 3.9, duration: 0.5, enabled: true, params: {} }] }));
    expect(errs.some((e) => e.includes('past total duration'))).toBe(true);
  });

  it('fails when quick duration exceeds total', () => {
    expect(validateTimeline(makeTimeline({ quickDurationSec: 5 })).some((e) => e.includes('Quick duration'))).toBe(true);
  });

  it('fails when there is no form/part/animation stage', () => {
    const errs = validateTimeline(makeTimeline({ stages: [{ id: 'f', type: 'finish-pose', startTime: 3, duration: 0.5, enabled: true, params: {} }] }));
    expect(errs.some((e) => e.includes('form/part/animation'))).toBe(true);
  });

  it('fails when there is no finish-pose or exit-stage', () => {
    const errs = validateTimeline(makeTimeline({ stages: [{ id: 'p', type: 'part-transform', startTime: 0, duration: 1, enabled: true, params: { partKey: 'wing_left' } }] }));
    expect(errs.some((e) => e.includes('finish-pose or exit-stage'))).toBe(true);
  });

  it('fails when the robot controller enables before the plane controller disables', () => {
    const errs = validateTimeline(makeTimeline({ controllerSwitchConfig: { planeControllerDisableTime: 3, robotControllerEnableTime: 1 } }));
    expect(errs.some((e) => e.includes('Plane controller must disable'))).toBe(true);
  });

  it('flags an unknown character id when a set is provided', () => {
    expect(validateTimeline(makeTimeline({ characterId: 'nope' }), new Set(['char_jett'])).some((e) => e.includes('Unknown characterId'))).toBe(true);
  });
});
