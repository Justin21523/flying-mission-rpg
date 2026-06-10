import type { PathControlMode } from '../../types/path';
import type { BoostExitBehavior } from '../../types/boostPad';

// Phase B — the PathFollow bus. A BoostPad (or any caller) sets the player onto a curve-based path here;
// Player.tsx consumes it each frame to drive/guide the body along the cached CatmullRomCurve3. Mirrors the
// dashImpulse pattern: a plain module object mutated outside React (no re-render, no per-frame allocation).
export const pathFollow: {
  active: boolean;
  pathId: string;
  mode: PathControlMode;
  u: number;            // arc-length progress 0..1 (advanced by Player.tsx)
  speed: number;        // base follow speed (world units / s)
  dir: 1 | -1;          // travel direction along the curve
  exit: BoostExitBehavior;
} = { active: false, pathId: '', mode: 'forwardLocked', u: 0, speed: 6, dir: 1, exit: 'releaseControl' };

interface EnterOpts { u?: number; speed?: number; dir?: 1 | -1; exit?: BoostExitBehavior }

export function enterPathFollow(pathId: string, mode: PathControlMode, opts: EnterOpts = {}): void {
  pathFollow.active = true;
  pathFollow.pathId = pathId;
  pathFollow.mode = mode;
  pathFollow.u = opts.u ?? 0;
  pathFollow.speed = opts.speed ?? 6;
  pathFollow.dir = opts.dir ?? 1;
  pathFollow.exit = opts.exit ?? 'releaseControl';
}

export function exitPathFollow(): void {
  pathFollow.active = false;
}
