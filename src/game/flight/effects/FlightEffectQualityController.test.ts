import { describe, it, expect } from 'vitest';
import { computeFlightEffectConfig } from './FlightEffectQualityController';
import { SUNNY_FLIGHT_POLISH } from './FlightEffectPresets';
import { QUALITY_PRESETS } from '../../../data/configuration/qualityPresets';

describe('computeFlightEffectConfig', () => {
  it('low quality disables high-cost effects', () => {
    const c = computeFlightEffectConfig(QUALITY_PRESETS.low, SUNNY_FLIGHT_POLISH, false);
    expect(c.speedLines).toBe(false);     // low preset has speedLinesEnabled=false
    expect(c.airDistortion).toBe(false);
    expect(c.colorGrade).toBe(false);
  });
  it('high quality enables the effects', () => {
    const c = computeFlightEffectConfig(QUALITY_PRESETS.high, SUNNY_FLIGHT_POLISH, false);
    expect(c.speedLines).toBe(true);
    expect(c.airDistortion).toBe(true);
    expect(c.colorGrade).toBe(true);
    expect(c.cloudBreakParticles).toBeGreaterThan(0);
  });
  it('reduce-motion overrides motion-heavy flight effects even at high quality', () => {
    const c = computeFlightEffectConfig(QUALITY_PRESETS.high, SUNNY_FLIGHT_POLISH, true);
    expect(c.speedLines).toBe(false);
    expect(c.airDistortion).toBe(false);
    expect(c.speedLineIntensity).toBe(0);
  });
});
