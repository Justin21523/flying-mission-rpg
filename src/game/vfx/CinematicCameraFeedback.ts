import type { CinematicCameraFeedbackSettings } from '../../types/cinematicVfxTypes';
import { pushCombatCameraShake, pushCombatCameraFov, pushCombatCameraTimeScale } from './combatCameraFx';

// Applies a cinematic ability's camera-feedback layer (Batch F.5) to the combat camera-fx global. Hit-stop is
// a brief time-scale dip; focus-hint is a no-op placeholder (camera system untouched). Reduce-motion handled
// by the camera hook (it ignores shake/fov when motion is reduced).
let hitStopUntilMs = 0;

export function applyCameraFeedback(c: CinematicCameraFeedbackSettings, nowMs: number, didHit: boolean): void {
  if (c.screenShake?.enabled) pushCombatCameraShake(c.screenShake.intensity);
  if (c.fovPulse?.enabled) pushCombatCameraFov(c.fovPulse.amount);
  if (c.hitStop?.enabled && (!c.hitStop.onlyOnHit || didHit)) {
    pushCombatCameraTimeScale(0.25);
    hitStopUntilMs = nowMs + c.hitStop.durationSeconds * 1000;
  }
}

// True while a hit-stop window is active (read by the combat update to slow spawns/ai briefly — optional).
export function inHitStop(nowMs: number): boolean {
  return nowMs < hitStopUntilMs;
}
