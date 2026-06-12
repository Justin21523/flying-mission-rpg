import { describe, it, expect } from 'vitest';
import { resolveTierPreset, applyReduceMotionOverrides, supportLimitsForPreset } from './QualityPresetController';
import { validateQualityPreset } from './qualityPresetSchema';
import { QUALITY_PRESETS } from '../../data/configuration/qualityPresets';

describe('resolveTierPreset', () => {
  it('returns the seed preset for a known tier when nothing is authored', () => {
    expect(resolveTierPreset('low', {}).renderLevel).toBe('low');
    expect(resolveTierPreset('ultra', {}).shadowMapSize).toBe(QUALITY_PRESETS.ultra.shadowMapSize);
  });
  it('applies the custom patch on top of the custom base', () => {
    const p = resolveTierPreset('custom', { maxActiveCharacters: 5, speedLinesEnabled: false });
    expect(p.id).toBe('custom');
    expect(p.maxActiveCharacters).toBe(5);
    expect(p.speedLinesEnabled).toBe(false);
  });
});

describe('applyReduceMotionOverrides', () => {
  it('forces motion-heavy knobs off', () => {
    const out = applyReduceMotionOverrides(QUALITY_PRESETS.high, true);
    expect(out.cameraShakeEnabled).toBe(false);
    expect(out.speedLinesEnabled).toBe(false);
    expect(out.airDistortionEnabled).toBe(false);
    expect(out.dynamicFovEnabled).toBe(false);
  });
  it('is a no-op when reduce-motion is off', () => {
    expect(applyReduceMotionOverrides(QUALITY_PRESETS.high, false)).toEqual(QUALITY_PRESETS.high);
  });
});

describe('supportLimitsForPreset', () => {
  it('maps the character/AI budgets onto the Batch-8 limit patch', () => {
    const patch = supportLimitsForPreset(QUALITY_PRESETS.low);
    expect(patch).toEqual({ maxActiveCharacters: 1, maxStandbyCharacters: 1, aiTickRateActive: 8, aiTickRateStandby: 2 });
  });
  it('high quality raises the budgets above low', () => {
    expect(supportLimitsForPreset(QUALITY_PRESETS.high).maxActiveCharacters).toBeGreaterThan(supportLimitsForPreset(QUALITY_PRESETS.low).maxActiveCharacters!);
  });
});

describe('validateQualityPreset', () => {
  it('accepts the seed presets', () => {
    expect(validateQualityPreset(QUALITY_PRESETS.medium).ok).toBe(true);
  });
  it('rejects maxActiveCharacters < 1', () => {
    expect(validateQualityPreset({ ...QUALITY_PRESETS.medium, maxActiveCharacters: 0 }).ok).toBe(false);
  });
  it('rejects an invalid shadow map size', () => {
    expect(validateQualityPreset({ ...QUALITY_PRESETS.medium, shadowMapSize: 999 }).ok).toBe(false);
  });
  it('rejects a non-positive target fps', () => {
    expect(validateQualityPreset({ ...QUALITY_PRESETS.medium, targetFps: 0 }).ok).toBe(false);
  });
});
