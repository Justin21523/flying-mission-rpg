import type { FlightRoute } from '../../../types/game/flight';
import type { FlightEventDef } from '../../../types/game/flightEvent';
import { FLIGHT_EVENT_KINDS } from '../../../types/game/flightEvent';

// Pure validation (no zod — matches the repo). Returns a list of human-readable errors ([] = valid). The
// editor tabs show these inline; the runtime/director skip invalid routes/events rather than crashing.
const KINDSET = new Set<string>(FLIGHT_EVENT_KINDS);

export function validateRoute(r: FlightRoute): string[] {
  const errs: string[] = [];
  if (!r.id?.trim()) errs.push('Route id is empty.');
  if (!r.fromLocationId?.trim()) errs.push('Origin (from) is empty.');
  if (!r.toLocationId?.trim()) errs.push('Destination (to) is empty.');
  if (!(r.virtualDistance > 0)) errs.push('Virtual distance must be > 0.');
  if (!(r.estimatedFlightSec > 0)) errs.push('Estimated flight seconds must be > 0.');
  if (!r.pathId?.trim()) errs.push('No 航道 (pathId) selected — pick one in 🛣 Tracks / the Path field.');

  const segs = r.segments ?? [];
  if (!segs.some((s) => s.kind === 'approach')) errs.push('Route needs at least one "approach" segment.');
  for (const s of segs) {
    if (s.startU < 0 || s.startU > 1 || s.endU < 0 || s.endU > 1) errs.push(`Segment ${s.id}: startU/endU must be within 0..1.`);
    if (s.startU >= s.endU) errs.push(`Segment ${s.id}: startU must be < endU.`);
    if (s.minAltitude != null && s.maxAltitude != null && s.minAltitude > s.maxAltitude) errs.push(`Segment ${s.id}: minAltitude > maxAltitude.`);
    for (const k of s.allowedEventKinds ?? []) if (!KINDSET.has(k)) errs.push(`Segment ${s.id}: unknown event kind "${k}".`);
  }
  return errs;
}

export function validateEvent(e: FlightEventDef): string[] {
  const errs: string[] = [];
  if (!e.id?.trim()) errs.push('Event id is empty.');
  if (!(e.weight >= 0)) errs.push('Weight must be >= 0.');
  if (!(e.minGapSec >= 0)) errs.push('Cooldown (minGapSec) must be >= 0.');
  const lo = e.minRouteProgress ?? 0;
  const hi = e.maxRouteProgress ?? 1;
  if (lo < 0 || lo > 1) errs.push('minRouteProgress must be within 0..1.');
  if (hi < 0 || hi > 1) errs.push('maxRouteProgress must be within 0..1.');
  if (lo >= hi) errs.push('minRouteProgress must be < maxRouteProgress.');
  if (e.minAltitude != null && e.maxAltitude != null && e.minAltitude > e.maxAltitude) errs.push('minAltitude > maxAltitude.');
  for (const k of e.canOverlapWith ?? []) if (!KINDSET.has(k)) errs.push(`Unknown canOverlapWith kind "${k}".`);
  return errs;
}
