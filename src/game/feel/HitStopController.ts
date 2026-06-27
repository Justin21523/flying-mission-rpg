import { useSettingsStore } from '../../stores/useSettingsStore';

let hitStopUntil = 0;

export function triggerHitStop(durationMs: number): number {
  if (!useSettingsStore.getState().hitStop) return 0;
  hitStopUntil = Math.max(hitStopUntil, Date.now() + Math.max(0, durationMs));
  return hitStopUntil;
}

export function isHitStopActive(now = Date.now()): boolean {
  return now < hitStopUntil;
}

export function clearHitStop(): void {
  hitStopUntil = 0;
}
