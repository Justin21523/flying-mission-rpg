import type { SurfaceDefinition } from '../../types/surface';
import { playerMotion } from '../player/playerMotion';

// Phase F+ — applies SurfaceDefinition multipliers to the player's movement. A surface zone (a collision object
// carrying a surfaceType) calls enterSurface on intersection-enter and exitSurface on exit; the most recently
// entered still-active surface wins. The active multipliers are written into playerMotion (read by
// applyMovement). Default (no surface) = 1×. Module-level, no React, no per-frame allocation.
const active = new Map<string, SurfaceDefinition>(); // objectId → surface (insertion order = recency)

function recompute(): void {
  let def: SurfaceDefinition | undefined;
  for (const d of active.values()) def = d; // last (most-recent) wins
  playerMotion.surfaceSpeedMult = def?.maxSpeedMultiplier ?? 1;
  playerMotion.surfaceAccelMult = def?.accelerationMultiplier ?? 1;
  playerMotion.surfaceBrakeMult = def?.brakingMultiplier ?? 1;
}

export function enterSurface(objectId: string, def: SurfaceDefinition): void {
  active.delete(objectId); // re-insert so it becomes the most recent
  active.set(objectId, def);
  recompute();
}

export function exitSurface(objectId: string): void {
  if (active.delete(objectId)) recompute();
}
