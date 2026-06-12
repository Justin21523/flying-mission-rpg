import { describe, expect, it } from 'vitest';
import { WORLD_PATH_ID } from '../../data/game/worldRoutes';
import type { FlightRoute } from '../../types/game/flight';
import { resolveFlightLeg, sampleUForDirection } from './flightLeg';

const route = (patch: Partial<FlightRoute> = {}): FlightRoute => ({
  id: 'route_test',
  name: 'Test Route',
  fromLocationId: 'home',
  toLocationId: 'dest',
  virtualDistance: 1000,
  estimatedFlightSec: 120,
  weather: 'clear',
  difficulty: 'easy',
  backgroundEnv: 'open_sky',
  eventPoolIds: [],
  pathId: 'outbound_path',
  ...patch,
});

describe('flight leg resolution', () => {
  it('uses the outbound path forward for outbound legs', () => {
    expect(resolveFlightLeg(route(), 'outbound')).toEqual({
      kind: 'outbound',
      pathId: 'outbound_path',
      cueKey: 'outbound_path:outbound',
      direction: 'forward',
    });
  });

  it('uses a separate return path forward by default', () => {
    expect(resolveFlightLeg(route({ returnPathId: 'return_path' }), 'return')).toEqual({
      kind: 'return',
      pathId: 'return_path',
      cueKey: 'return_path:return:forward',
      direction: 'forward',
    });
  });

  it('reuses the outbound path in reverse when no return path is authored', () => {
    expect(resolveFlightLeg(route(), 'return')).toEqual({
      kind: 'return',
      pathId: 'outbound_path',
      cueKey: 'outbound_path:return:reverse',
      direction: 'reverse',
    });
  });

  it('falls back to the seeded world path when a route has no path id', () => {
    expect(resolveFlightLeg(route({ pathId: undefined }), 'outbound').pathId).toBe(WORLD_PATH_ID);
  });

  it('maps timeline progress through forward and reverse directions', () => {
    expect(sampleUForDirection(0.25, 'forward')).toBe(0.25);
    expect(sampleUForDirection(0.25, 'reverse')).toBe(0.75);
    expect(sampleUForDirection(-1, 'forward')).toBe(0);
    expect(sampleUForDirection(2, 'reverse')).toBe(0);
  });
});
