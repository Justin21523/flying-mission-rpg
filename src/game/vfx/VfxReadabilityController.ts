import { useSettingsStore } from '../../stores/useSettingsStore';
import { getVfxPerformanceBudget } from './VfxPerformanceBudget';

export function shouldShowDamageNumbers(): boolean {
  return useSettingsStore.getState().damageNumbers !== 'off';
}

export function shouldReduceVfxFlashing(): boolean {
  return useSettingsStore.getState().reduceFlashing;
}

export function getReadableVfxBudget() {
  return getVfxPerformanceBudget();
}
