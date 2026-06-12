import { describe, it, expect } from 'vitest';
import { applyReduceMotion } from './TransformationPolishDirector';
import { TransformationReplayController, type ReplayableRunner } from './TransformationReplayController';
import { validateTransformationPolish } from './transformationPolishSchema';
import { SEED_TRANSFORMATION_POLISH } from '../../../data/game/transformationPolish';

describe('applyReduceMotion (transformation polish)', () => {
  it('caps quick-mode polish at minimal and dims the backdrop pulse', () => {
    const base = { ...SEED_TRANSFORMATION_POLISH[0], quickModePolishLevel: 'flashy' as const, backdropPulseIntensity: 1.5 };
    const out = applyReduceMotion(base, true);
    expect(out.quickModePolishLevel).toBe('minimal');
    expect(out.backdropPulseIntensity).toBeLessThanOrEqual(0.5);
  });
  it('is a no-op when reduce-motion is off', () => {
    expect(applyReduceMotion(SEED_TRANSFORMATION_POLISH[0], false)).toEqual(SEED_TRANSFORMATION_POLISH[0]);
  });
});

describe('validateTransformationPolish', () => {
  it('accepts the seed presets', () => {
    for (const p of SEED_TRANSFORMATION_POLISH) expect(validateTransformationPolish(p).ok).toBe(true);
  });
  it('rejects an out-of-range backdrop pulse', () => {
    expect(validateTransformationPolish({ ...SEED_TRANSFORMATION_POLISH[0], backdropPulseIntensity: 5 }).ok).toBe(false);
  });
});

describe('TransformationReplayController', () => {
  it('resets the runner and clears prior effects before each replay', () => {
    let resets = 0;
    let lastSeek = -1;
    const runner: ReplayableRunner = { reset: () => { resets += 1; }, seek: (t) => { lastSeek = t; } };
    const ctrl = new TransformationReplayController(runner);
    ctrl.replay();
    ctrl.replay();
    expect(resets).toBe(2);
    expect(ctrl.replayCount).toBe(2);
    ctrl.replayFrom(3.5);
    expect(resets).toBe(3);
    expect(lastSeek).toBe(3.5);
    expect(ctrl.replayCount).toBe(3);
  });
});
