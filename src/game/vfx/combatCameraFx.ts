// Combat camera feedback global (Batch F.5) — mirrors the transformation `txCameraFx`. Cinematic ability
// camera layers write here (shake/fovDelta/timeScale); a small read-hook in the combat camera controller
// applies it. Decays toward neutral each frame so a missing controller is a safe no-op (never breaks camera).

export const combatCameraFx = { shake: 0, fovDelta: 0, timeScale: 1 };

// Apply a one-shot camera feedback (additively combined with anything already pending).
export function pushCombatCameraShake(intensity: number): void {
  combatCameraFx.shake = Math.max(combatCameraFx.shake, intensity);
}
export function pushCombatCameraFov(amount: number): void {
  combatCameraFx.fovDelta += amount;
}
export function pushCombatCameraTimeScale(scale: number): void {
  combatCameraFx.timeScale = scale;
}

// Decay toward neutral (called each frame by the camera hook or the runtime tick).
export function decayCombatCameraFx(dt: number): void {
  combatCameraFx.shake = Math.max(0, combatCameraFx.shake - dt * 8 * (combatCameraFx.shake + 0.2));
  combatCameraFx.fovDelta *= Math.max(0, 1 - dt * 6);
  if (Math.abs(combatCameraFx.fovDelta) < 0.01) combatCameraFx.fovDelta = 0;
  combatCameraFx.timeScale += (1 - combatCameraFx.timeScale) * Math.min(1, dt * 5);
}

export function resetCombatCameraFx(): void {
  combatCameraFx.shake = 0;
  combatCameraFx.fovDelta = 0;
  combatCameraFx.timeScale = 1;
}
