import { nanoid } from 'nanoid';
import type { RouteSegment } from '../../../types/game/flight';

// Pure helpers for editing a route's flavour segments (no R3F → unit-testable). startU/endU are HARD-clamped
// into 0..1 with startU < endU kept (NumRow min/max don't clamp the stored value), so authored data is
// always valid and the world-flight director never reads an out-of-range band.
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const EPS = 0.001;

export function updateSegment(seg: RouteSegment, patch: Partial<RouteSegment>): RouteSegment {
  const next = { ...seg, ...patch };
  let startU = clamp01(next.startU);
  let endU = clamp01(next.endU);
  // keep startU strictly below endU; nudge whichever field the caller just moved
  if (startU >= endU) {
    if (patch.startU !== undefined) startU = Math.max(0, Math.min(endU - EPS, startU));
    else endU = Math.min(1, Math.max(startU + EPS, endU));
  }
  next.startU = startU;
  next.endU = endU;
  return next;
}

export function duplicateSegment(seg: RouteSegment): RouteSegment {
  return { ...seg, id: `seg_${nanoid(5)}` };
}

export function removeSegment(segments: RouteSegment[], id: string): RouteSegment[] {
  return segments.filter((s) => s.id !== id);
}

export function replaceSegment(segments: RouteSegment[], id: string, patch: Partial<RouteSegment>): RouteSegment[] {
  return segments.map((s) => (s.id === id ? updateSegment(s, patch) : s));
}
