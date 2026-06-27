import { describe, it, expect } from 'vitest';
import { effectiveGodMode, difficultyDamageMult, runDamageMult, dmgScaleForMode } from './difficulty';
import { makeUtilityFeedback } from './CombatFeedbackClassifier';
import type { RunConfig } from '../../data/progression/runConfig';

describe('effectiveGodMode', () => {
  it('dev flag forces god mode regardless of difficulty', () => {
    expect(effectiveGodMode(true, 'normal')).toBe(true);
    expect(effectiveGodMode(true, 'hard')).toBe(true);
  });
  it("'easy' difficulty enables god mode; normal/hard do not", () => {
    expect(effectiveGodMode(false, 'easy')).toBe(true);
    expect(effectiveGodMode(false, 'normal')).toBe(false);
    expect(effectiveGodMode(false, 'hard')).toBe(false);
  });
});

describe('difficultyDamageMult', () => {
  it('easy/normal = 1, hard tougher', () => {
    expect(difficultyDamageMult('easy')).toBe(1);
    expect(difficultyDamageMult('normal')).toBe(1);
    expect(difficultyDamageMult('hard')).toBeGreaterThan(1);
  });
});

describe('runDamageMult', () => {
  it('is 1 outside a run', () => {
    expect(runDamageMult(false, 9, 0.1)).toBe(1);
  });
  it('escalates with the round inside a run', () => {
    expect(runDamageMult(true, 1, 0.1)).toBeCloseTo(1);
    expect(runDamageMult(true, 6, 0.1)).toBeCloseTo(1.5);
  });
});

describe('dmgScaleForMode', () => {
  const cfg = { endless: { dmgScalePerRound: 0.08 }, roguelite: { dmgScalePerRound: 0.1 } } as RunConfig;
  it('reads the per-mode scale, falling back to 0', () => {
    expect(dmgScaleForMode(cfg, 'endless')).toBe(0.08);
    expect(dmgScaleForMode(cfg, 'roguelite')).toBe(0.1);
    expect(dmgScaleForMode(undefined, 'endless')).toBe(0);
  });
});

describe("makeUtilityFeedback('parry')", () => {
  it('produces a strong Parry! event', () => {
    const e = makeUtilityFeedback('parry', undefined, undefined, 1000);
    expect(e.kind).toBe('parry');
    expect(e.label).toBe('Parry!');
    expect(e.tier).toBe('strong');
  });
});
