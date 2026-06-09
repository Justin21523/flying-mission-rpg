// POLI yokai-hunt — dash-strike impulse bus. transformStore.triggerSuperMove (kind 'dash') sets a forward
// lunge here; Player.tsx consumes it each frame to drive the body forward for a brief window (a real dash).
export const dashImpulse = { active: false, dirX: 0, dirZ: 1, speed: 0, until: 0 };

export function triggerDash(dirX: number, dirZ: number, speed: number, durationSec: number): void {
  const now = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
  dashImpulse.active = true; dashImpulse.dirX = dirX; dashImpulse.dirZ = dirZ;
  dashImpulse.speed = speed; dashImpulse.until = now + durationSec;
}
