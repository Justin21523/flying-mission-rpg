import type { FlightRoute, RouteSegment } from '../../../types/game/flight';
import type { FlightEventKind } from '../../../types/game/flightEvent';

// Pure route-runtime helpers (no R3F) — segment lookup + progress maths along a route's 0..1 parameter.
// Used by the director, HUD and debug panel. Testable.

export function segmentAtU(route: FlightRoute, u: number): RouteSegment | undefined {
  return route.segments?.find((s) => u >= s.startU && u < s.endU);
}

// The event kinds the director may spawn at u: the current segment's allowedEventKinds (if any), else none
// (the caller falls back to the route's full pool when this is empty).
export function allowedKindsAtU(route: FlightRoute, u: number): FlightEventKind[] {
  return segmentAtU(route, u)?.allowedEventKinds ?? [];
}

export function eventDensityAtU(route: FlightRoute, u: number): number {
  return segmentAtU(route, u)?.eventDensity ?? 1;
}

export function remainingDistance(route: FlightRoute, u: number): number {
  return Math.max(0, Math.round((1 - clamp01(u)) * route.virtualDistance));
}

export function isApproaching(route: FlightRoute, u: number): boolean {
  return u >= (route.approachStartU ?? 0.85);
}

function clamp01(u: number): number {
  return u < 0 ? 0 : u > 1 ? 1 : u;
}
