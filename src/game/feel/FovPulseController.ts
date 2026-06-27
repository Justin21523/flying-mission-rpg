import { useSettingsStore } from '../../stores/useSettingsStore';

let pulse = 0;

export function triggerFovPulse(amount: number): number {
  if (!useSettingsStore.getState().cameraEffects) return 0;
  pulse = Math.max(0, Math.min(1, amount));
  return pulse;
}

export function consumeFovPulse(decay = 0.08): number {
  const value = pulse;
  pulse = Math.max(0, pulse - decay);
  return value;
}
