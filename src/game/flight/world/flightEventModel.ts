import type { FlightEventDef, FlightEventKind } from '../../../types/game/flightEvent';

// Pure flight-event selection (kept out of the frame loop → unit-testable). Picks the next event from the
// route pool by weight, respecting per-event cooldown (minGapSec) plus the director gating supplied in
// `ctx`: the current segment's allowed kinds, the route-progress window, the altitude window, overlap rules
// (canOverlapWith vs. currently-active kinds) and a blocking cap. `rand` is injected for determinism.
export interface PickContext {
  allowedKinds?: FlightEventKind[]; // segment restriction (empty/undefined = any kind)
  routeU?: number; // current 0..1 progress (gates min/maxRouteProgress)
  altitude?: number; // current craft altitude (gates min/maxAltitude)
  activeKinds?: FlightEventKind[]; // kinds currently active (gates canOverlapWith)
  blockingActiveCount?: number; // how many blocking events are active now
  maxBlocking?: number; // cap on concurrent blocking events (default 1)
}

// Can candidate `e` coexist with everything currently active? If `canOverlapWith` is defined, every active
// kind must be the same kind or listed in it; undefined = overlaps anything.
function overlapsOk(e: FlightEventDef, activeKinds: FlightEventKind[]): boolean {
  if (!e.canOverlapWith) return true;
  const allow = new Set<FlightEventKind>([...e.canOverlapWith, e.kind]);
  return activeKinds.every((k) => allow.has(k));
}

export function isEligible(e: FlightEventDef, nowSec: number, lastSpawnByEvent: Record<string, number>, ctx?: PickContext): boolean {
  if (nowSec - (lastSpawnByEvent[e.id] ?? -1e9) < e.minGapSec) return false; // cooldown
  if (!ctx) return true;
  if (ctx.allowedKinds && ctx.allowedKinds.length > 0 && !ctx.allowedKinds.includes(e.kind)) return false;
  if (ctx.routeU != null && (ctx.routeU < (e.minRouteProgress ?? 0) || ctx.routeU > (e.maxRouteProgress ?? 1))) return false;
  if (ctx.altitude != null) {
    if (e.minAltitude != null && ctx.altitude < e.minAltitude) return false;
    if (e.maxAltitude != null && ctx.altitude > e.maxAltitude) return false;
  }
  if (e.blocking && ctx.blockingActiveCount != null && ctx.blockingActiveCount >= (ctx.maxBlocking ?? 1)) return false;
  if (ctx.activeKinds && ctx.activeKinds.length > 0 && !overlapsOk(e, ctx.activeKinds)) return false;
  return true;
}

export function pickEvent(
  pool: FlightEventDef[],
  nowSec: number,
  lastSpawnByEvent: Record<string, number>,
  rand: () => number,
  ctx?: PickContext,
): FlightEventDef | null {
  const eligible = pool.filter((e) => isEligible(e, nowSec, lastSpawnByEvent, ctx));
  if (eligible.length === 0) return null;
  const total = eligible.reduce((s, e) => s + Math.max(0, e.weight), 0);
  if (total <= 0) return eligible[0];
  let r = rand() * total;
  for (const e of eligible) {
    r -= Math.max(0, e.weight);
    if (r <= 0) return e;
  }
  return eligible[eligible.length - 1];
}
