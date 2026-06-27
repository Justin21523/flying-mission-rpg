import type { DensityLevel, VfxIntensity } from '../../stores/useSettingsStore';

export type VfxIntensityProfile = {
  intensity: VfxIntensity;
  particleMultiplier: number;
  debrisMultiplier: number;
  maxDamageNumbers: number;
  cameraEffectMultiplier: number;
};

const densityValue: Record<DensityLevel, number> = { off: 0, low: 0.35, medium: 0.7, high: 1 };

export function densityMultiplier(level: DensityLevel): number {
  return densityValue[level];
}

export function getVfxIntensityProfile(intensity: VfxIntensity): VfxIntensityProfile {
  if (intensity === 'low') return { intensity, particleMultiplier: 0.35, debrisMultiplier: 0.25, maxDamageNumbers: 4, cameraEffectMultiplier: 0.35 };
  if (intensity === 'medium') return { intensity, particleMultiplier: 0.7, debrisMultiplier: 0.55, maxDamageNumbers: 8, cameraEffectMultiplier: 0.65 };
  if (intensity === 'cinematic') return { intensity, particleMultiplier: 1.35, debrisMultiplier: 1.15, maxDamageNumbers: 16, cameraEffectMultiplier: 1 };
  return { intensity, particleMultiplier: 1, debrisMultiplier: 0.8, maxDamageNumbers: 12, cameraEffectMultiplier: 0.8 };
}
