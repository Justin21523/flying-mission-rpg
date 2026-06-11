import type { FlightCue } from '../../types/game/flightCue';
import type { Easing } from '../../types/game/transformation';

// Pure resolver for the flight cue timeline — given the cues (any order) and the current progress u∈[0,1],
// returns the active camera frame (interpolated between camera cues), the active animation/action, the active
// environment, and the event cues (with which are "firing" near u). No R3F → unit-testable. Mirrors the
// transformation runner's "resolve a snapshot at t" shape.

export interface ResolvedFlightCamera { distance: number; height: number; angleDeg: number; fov: number }
export interface ResolvedFlightAnim { clipName: string; clipSpeed: number; bankDeg: number; speedMul: number }
export interface ResolvedFlightEnv { skyTop?: string; skyBottom?: string; fogDensity: number; cloudHint: number }
export interface ResolvedFlightCues {
  camera: ResolvedFlightCamera | null;
  animation: ResolvedFlightAnim | null;
  environment: ResolvedFlightEnv | null;
  events: FlightCue[]; // all event cues (always shown as markers)
  activeEventIds: string[]; // events whose atU is within EVENT_WINDOW of u (visually "firing")
}

export const EVENT_WINDOW = 0.03; // ± progress around a cue where its event is considered active

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Shared easing (same shapes as the transformation runner) for the camera move between cues.
function ease(e: Easing | undefined, t: number): number {
  const x = t < 0 ? 0 : t > 1 ? 1 : t;
  switch (e) {
    case 'easeIn': return x * x;
    case 'easeOut': return 1 - (1 - x) * (1 - x);
    case 'easeInOut': return x * x * (3 - 2 * x);
    default: return x;
  }
}

// last cue with atU ≤ u (cues assumed/forced sorted by atU)
function lastBefore(cues: FlightCue[], u: number): FlightCue | null {
  let found: FlightCue | null = null;
  for (const c of cues) { if (c.atU <= u) found = c; else break; }
  return found;
}

function resolveCamera(cams: FlightCue[], u: number): ResolvedFlightCamera | null {
  if (cams.length === 0) return null;
  const frame = (c: FlightCue): ResolvedFlightCamera => ({
    distance: c.camDistance ?? 12, height: c.camHeight ?? 4, angleDeg: c.camAngleDeg ?? 0, fov: c.camFov ?? 55,
  });
  let prev: FlightCue | null = null;
  let next: FlightCue | null = null;
  for (const c of cams) { if (c.atU <= u) prev = c; else { next = c; break; } }
  if (prev && next) {
    const span = next.atU - prev.atU;
    const t = ease(next.easing, span > 1e-6 ? (u - prev.atU) / span : 0); // the destination cue's curve
    const a = frame(prev); const b = frame(next);
    return { distance: lerp(a.distance, b.distance, t), height: lerp(a.height, b.height, t), angleDeg: lerp(a.angleDeg, b.angleDeg, t), fov: lerp(a.fov, b.fov, t) };
  }
  return frame(prev ?? next!); // before the first / after the last → hold the nearest
}

export function resolveFlightCues(cues: readonly FlightCue[], u: number): ResolvedFlightCues {
  const sorted = [...cues].sort((a, b) => a.atU - b.atU);
  const cams = sorted.filter((c) => c.type === 'camera');
  const anims = sorted.filter((c) => c.type === 'animation');
  const envs = sorted.filter((c) => c.type === 'environment');
  const events = sorted.filter((c) => c.type === 'event');

  const animCue = lastBefore(anims, u);
  const animation: ResolvedFlightAnim | null = animCue
    ? { clipName: animCue.clipName ?? '', clipSpeed: animCue.clipSpeed ?? 1, bankDeg: animCue.bankDeg ?? 0, speedMul: animCue.speedMul ?? 1 }
    : null;

  const envCue = lastBefore(envs, u);
  const environment: ResolvedFlightEnv | null = envCue
    ? { skyTop: envCue.skyTop, skyBottom: envCue.skyBottom, fogDensity: envCue.fogDensity ?? 0, cloudHint: envCue.cloudHint ?? 0 }
    : null;

  return {
    camera: resolveCamera(cams, u),
    animation,
    environment,
    events,
    activeEventIds: events.filter((e) => Math.abs(e.atU - u) <= EVENT_WINDOW).map((e) => e.id),
  };
}
