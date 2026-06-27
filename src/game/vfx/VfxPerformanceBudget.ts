import { useSettingsStore } from '../../stores/useSettingsStore';
import { densityMultiplier, getVfxIntensityProfile } from './VfxIntensitySettings';

export type VfxPerformanceBudget = {
  maxActiveParticles: number;
  maxActivePhysicsVfxObjects: number;
  maxActiveVfxInstances: number;
  maxDamageNumbers: number;
};

export function getVfxPerformanceBudget(): VfxPerformanceBudget {
  const settings = useSettingsStore.getState();
  const profile = getVfxIntensityProfile(settings.vfxIntensity);
  return {
    maxActiveParticles: Math.round(1200 * profile.particleMultiplier * densityMultiplier(settings.particleDensity)),
    maxActivePhysicsVfxObjects: Math.round(120 * profile.debrisMultiplier * densityMultiplier(settings.physicsDebris)),
    maxActiveVfxInstances: Math.round(48 * profile.particleMultiplier),
    maxDamageNumbers: settings.damageNumbers === 'off' ? 0 : settings.damageNumbers === 'minimal' ? Math.min(8, profile.maxDamageNumbers) : profile.maxDamageNumbers,
  };
}
