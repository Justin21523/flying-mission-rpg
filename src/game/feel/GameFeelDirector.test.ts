import { beforeEach, describe, expect, it } from 'vitest';
import { clearCameraShake, getLatestCameraShake } from './CameraShakeController';
import { clearHitStop, isHitStopActive } from './HitStopController';
import { triggerGameFeelFromFeedback } from './GameFeelDirector';
import { useSettingsStore } from '../../stores/useSettingsStore';
import type { CombatFeedbackEvent } from '../combat/CombatFeedbackClassifier';

const event = (kind: CombatFeedbackEvent['kind'], tier: CombatFeedbackEvent['tier']): CombatFeedbackEvent => ({
  id: `fb_${kind}`,
  kind,
  tier,
  label: kind,
  createdAtMs: Date.now(),
});

beforeEach(() => {
  useSettingsStore.getState().resetSettings();
  clearCameraShake();
  clearHitStop();
});

describe('GameFeelDirector feedback routing', () => {
  it('triggers stronger feedback for shield break', () => {
    triggerGameFeelFromFeedback(event('shield-break', 'strong'));
    expect(getLatestCameraShake()?.reason).toBe('shield-break');
    expect(isHitStopActive()).toBe(true);
  });

  it('respects camera and hit-stop settings', () => {
    useSettingsStore.getState().updateSettings({ screenShake: 'off', hitStop: false, cameraEffects: false });
    triggerGameFeelFromFeedback(event('weakpoint-hit', 'strong'));
    expect(getLatestCameraShake()).toBeNull();
    expect(isHitStopActive()).toBe(false);
  });
});
