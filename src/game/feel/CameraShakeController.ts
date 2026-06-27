import { useSettingsStore, type ScreenShakeLevel } from '../../stores/useSettingsStore';

export type CameraShakeEvent = {
  amplitude: number;
  durationMs: number;
  createdAt: number;
  reason: string;
};

let latestShake: CameraShakeEvent | null = null;

const scale: Record<ScreenShakeLevel, number> = { off: 0, low: 0.35, medium: 0.7, high: 1 };

export function triggerCameraShake(amplitude: number, durationMs: number, reason = 'game-feel'): CameraShakeEvent | null {
  const settings = useSettingsStore.getState();
  const amount = amplitude * scale[settings.screenShake];
  if (!settings.cameraEffects || amount <= 0) return null;
  latestShake = { amplitude: amount, durationMs, reason, createdAt: Date.now() };
  return latestShake;
}

export function getLatestCameraShake(): CameraShakeEvent | null {
  return latestShake;
}

export function clearCameraShake(): void {
  latestShake = null;
}
