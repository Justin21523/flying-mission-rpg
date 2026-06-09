// POLI yokai-hunt (Phase J) — light, recoverable "player got bumped" bus. A yokai attack calls
// triggerPlayerHit with the knockback direction (yokai → player) + strength; Player.tsx consumes the pending
// flag each frame to shove the player back briefly (no death, fully recoverable).
export const playerHit = { pending: false, dirX: 0, dirZ: 0, strength: 0 };

export function triggerPlayerHit(dirX: number, dirZ: number, strength: number): void {
  playerHit.pending = true; playerHit.dirX = dirX; playerHit.dirZ = dirZ; playerHit.strength = strength;
}
