import type { CinematicCameraFeedbackSettings } from '../../types/cinematicVfxTypes';

// Reusable camera-feedback presets (Batch F.5). Light on specials, big on ultimates — always brief + decayed.
export const CAMERA_PRESETS = {
  lightHit: (): CinematicCameraFeedbackSettings => ({ screenShake: { enabled: true, intensity: 0.12, durationSeconds: 0.12 } }),
  heavyHit: (): CinematicCameraFeedbackSettings => ({ screenShake: { enabled: true, intensity: 0.3, durationSeconds: 0.2 }, hitStop: { enabled: true, durationSeconds: 0.08, onlyOnHit: true } }),
  ultimate: (): CinematicCameraFeedbackSettings => ({ screenShake: { enabled: true, intensity: 0.5, durationSeconds: 0.4 }, fovPulse: { enabled: true, amount: 6, durationSeconds: 0.4 }, hitStop: { enabled: true, durationSeconds: 0.12, onlyOnHit: false }, focusHint: { enabled: true, target: 'caster', durationSeconds: 0.6 } }),
} as const;
