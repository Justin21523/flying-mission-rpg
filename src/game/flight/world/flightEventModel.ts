import type { FlightEventDef } from '../../../types/game/flightEvent';

// Pure flight-event selection (kept out of the frame loop → unit-testable). Picks the next event from the
// route pool by weight, respecting each event's per-kind cooldown (minGapSec since it last spawned). The
// director gates calls to a global interval so events never overlap. `rand` injected for determinism.
export function pickEvent(
  pool: FlightEventDef[],
  nowSec: number,
  lastSpawnByEvent: Record<string, number>,
  rand: () => number,
): FlightEventDef | null {
  const eligible = pool.filter((e) => nowSec - (lastSpawnByEvent[e.id] ?? -1e9) >= e.minGapSec);
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
