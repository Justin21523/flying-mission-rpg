import { describe, it, expect } from 'vitest';
import { validateRoute, validateEvent } from './worldFlightValidation';
import type { FlightRoute } from '../../../types/game/flight';
import type { FlightEventDef } from '../../../types/game/flightEvent';

const route = (over: Partial<FlightRoute> = {}): FlightRoute => ({
  id: 'r1',
  name: 'R1',
  fromLocationId: 'loc_home',
  toLocationId: 'loc_dest',
  virtualDistance: 1000,
  estimatedFlightSec: 120,
  weather: 'clear',
  difficulty: 'easy',
  backgroundEnv: 'open_sky',
  eventPoolIds: [],
  pathId: 'p1',
  segments: [
    { id: 's0', kind: 'cloud', startU: 0, endU: 0.8 },
    { id: 's1', kind: 'approach', startU: 0.85, endU: 1 },
  ],
  ...over,
});

const event = (over: Partial<FlightEventDef> = {}): FlightEventDef => ({
  id: 'e1',
  kind: 'collectible',
  label: 'E1',
  weight: 1,
  minGapSec: 4,
  lateralRange: 4,
  color: '#fff',
  size: 1,
  durationSec: 5,
  minRouteProgress: 0,
  maxRouteProgress: 1,
  canOverlapWith: [],
  sourceConfidence: 'GameAdaptation',
  ...over,
});

describe('validateRoute', () => {
  it('passes a well-formed route', () => {
    expect(validateRoute(route())).toEqual([]);
  });
  it('fails when there is no approach segment', () => {
    const errs = validateRoute(route({ segments: [{ id: 's0', kind: 'cloud', startU: 0, endU: 1 }] }));
    expect(errs.some((e) => e.includes('approach'))).toBe(true);
  });
  it('fails when a segment has startU >= endU', () => {
    const errs = validateRoute(route({ segments: [{ id: 's0', kind: 'approach', startU: 0.9, endU: 0.5 }] }));
    expect(errs.some((e) => e.includes('startU must be < endU'))).toBe(true);
  });
  it('fails when an altitude range is inverted', () => {
    const errs = validateRoute(route({ segments: [{ id: 's0', kind: 'approach', startU: 0, endU: 1, minAltitude: 100, maxAltitude: 50 }] }));
    expect(errs.some((e) => e.includes('minAltitude > maxAltitude'))).toBe(true);
  });
  it('fails when no path is selected', () => {
    expect(validateRoute(route({ pathId: '' })).some((e) => e.includes('航道'))).toBe(true);
  });
});

describe('validateEvent', () => {
  it('passes a well-formed event', () => {
    expect(validateEvent(event())).toEqual([]);
  });
  it('fails when progress range is inverted', () => {
    expect(validateEvent(event({ minRouteProgress: 0.8, maxRouteProgress: 0.2 })).length).toBeGreaterThan(0);
  });
  it('fails on negative cooldown', () => {
    expect(validateEvent(event({ minGapSec: -1 })).some((e) => e.includes('Cooldown'))).toBe(true);
  });
  it('fails on an unknown canOverlapWith kind', () => {
    // @ts-expect-error — intentionally invalid kind for the test
    expect(validateEvent(event({ canOverlapWith: ['nope'] })).some((e) => e.includes('Unknown'))).toBe(true);
  });
});
