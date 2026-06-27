import { triggerCameraShake } from './CameraShakeController';
import { triggerFovPulse } from './FovPulseController';
import { triggerHitStop } from './HitStopController';
import { triggerSlowMotion } from './SlowMotionController';
import { useSettingsStore } from '../../stores/useSettingsStore';
import type { CombatFeedbackEvent } from '../combat/CombatFeedbackClassifier';

export type GameFeelEvent = 'basic-hit' | 'heavy-hit' | 'shield-break' | 'boss-weakpoint' | 'ultimate';

let lastMinorFeedbackAt = 0;

export function triggerGameFeel(event: GameFeelEvent): void {
  if (event === 'basic-hit') {
    triggerHitStop(35);
    triggerCameraShake(0.12, 80, event);
  } else if (event === 'heavy-hit' || event === 'shield-break') {
    triggerHitStop(70);
    triggerCameraShake(0.24, 130, event);
    triggerFovPulse(0.25);
  } else if (event === 'boss-weakpoint') {
    triggerHitStop(95);
    triggerCameraShake(0.32, 160, event);
    triggerFovPulse(0.35);
  } else if (event === 'ultimate') {
    triggerSlowMotion(450, 0.55);
    triggerCameraShake(0.28, 220, event);
    triggerFovPulse(0.5);
  }
}

export function triggerGameFeelFromFeedback(event: CombatFeedbackEvent): void {
  const settings = useSettingsStore.getState();
  const now = Date.now();
  const reduce = settings.reduceFlashing;

  if (event.tier === 'minor') {
    if (now - lastMinorFeedbackAt < 180) return;
    lastMinorFeedbackAt = now;
    triggerHitStop(reduce ? 12 : 24);
    triggerCameraShake(reduce ? 0.03 : 0.08, 55, event.kind);
    return;
  }

  if (event.kind === 'shield-break') {
    triggerHitStop(reduce ? 35 : 70);
    triggerCameraShake(reduce ? 0.08 : 0.22, reduce ? 70 : 120, event.kind);
    if (!reduce) triggerFovPulse(0.22);
    return;
  }

  if (event.kind === 'weakpoint-hit' || event.kind === 'boss-weakpoint-exposed') {
    triggerHitStop(reduce ? 45 : 90);
    triggerCameraShake(reduce ? 0.1 : 0.28, reduce ? 85 : 150, event.kind);
    if (!reduce) triggerFovPulse(event.tier === 'cinematic' ? 0.32 : 0.2);
    return;
  }

  if (event.kind === 'ultimate-impact') {
    if (!reduce) triggerSlowMotion(320, 0.65);
    triggerCameraShake(reduce ? 0.1 : 0.28, reduce ? 100 : 190, event.kind);
    if (!reduce) triggerFovPulse(0.42);
    return;
  }

  // Batch P — parry: a crisp deflect feel (short hitstop + a brief slow-mo beat).
  if (event.kind === 'parry') {
    triggerHitStop(reduce ? 45 : 90);
    if (!reduce) triggerSlowMotion(200, 0.5);
    triggerCameraShake(reduce ? 0.06 : 0.16, reduce ? 70 : 110, event.kind);
    return;
  }

  // Wave 2 — execution finisher: a punchy slow-mo beat + big shake.
  if (event.kind === 'execution') {
    if (!reduce) triggerSlowMotion(reduce ? 200 : 350, 0.4);
    triggerHitStop(reduce ? 60 : 120);
    triggerCameraShake(reduce ? 0.12 : 0.28, reduce ? 90 : 160, event.kind);
    if (!reduce) triggerFovPulse(0.4);
    return;
  }

  if (event.tier === 'strong' || event.tier === 'cinematic') {
    triggerHitStop(reduce ? 30 : 60);
    triggerCameraShake(reduce ? 0.07 : 0.18, reduce ? 70 : 115, event.kind);
    return;
  }

  triggerHitStop(reduce ? 18 : 38);
  triggerCameraShake(reduce ? 0.04 : 0.11, reduce ? 55 : 85, event.kind);
}
