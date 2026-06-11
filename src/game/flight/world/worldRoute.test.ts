import { describe, it, expect, beforeEach } from 'vitest';
import { getActiveRoute, getActivePathId, getActiveEventPool } from './worldRoute';
import { useEditorRouteStore, getEditorRoutes } from '../../../stores/game/editorRouteStore';
import { useFlightStore } from '../../../stores/game/useFlightStore';
import { useMissionStore } from '../../../stores/game/useMissionStore';
import { useEditorFlightEventStore, getFlightEvents } from '../../../stores/game/editorFlightEventStore';
import { WORLD_PATH_ID } from '../../../data/game/worldRoutes';
import type { FlightRoute } from '../../../types/game/flight';
import type { FlightEventDef } from '../../../types/game/flightEvent';

const evt = (id: string): FlightEventDef => ({
  id, kind: 'birds', label: id, weight: 1, minGapSec: 1, lateralRange: 10, color: '#fff', size: 2, durationSec: 4,
  sourceConfidence: 'GameAdaptation',
});

const route = (over: Partial<FlightRoute>): FlightRoute => ({
  id: 'r', name: 'R', fromLocationId: 'a', toLocationId: 'b', virtualDistance: 1000, estimatedFlightSec: 180,
  weather: 'clear', difficulty: 'easy', backgroundEnv: 'open_sky', eventPoolIds: [], pathId: 'p', ...over,
});

describe('worldRoute active resolution', () => {
  beforeEach(() => {
    useEditorRouteStore.getState().importState({
      items: [route({ id: 'r1', pathId: 'p1' }), route({ id: 'r2', pathId: 'p2' })],
    });
    useFlightStore.getState().setRoute(null);
    useMissionStore.setState({ currentMissionId: null });
  });

  it('honours the currentRouteId override first', () => {
    useFlightStore.getState().setRoute('r2');
    expect(getActiveRoute()?.id).toBe('r2');
    expect(getActivePathId()).toBe('p2');
  });

  it('falls back to the first authored route when nothing is selected', () => {
    expect(getActiveRoute()?.id).toBe(getEditorRoutes()[0].id);
  });

  it('getActivePathId falls back to WORLD_PATH_ID when the route has no path', () => {
    useEditorRouteStore.getState().importState({ items: [route({ id: 'r1', pathId: undefined })] });
    useFlightStore.getState().setRoute('r1');
    expect(getActivePathId()).toBe(WORLD_PATH_ID);
  });
});

describe('getActiveEventPool', () => {
  beforeEach(() => {
    useMissionStore.setState({ currentMissionId: null });
    useEditorFlightEventStore.getState().importState({ items: [evt('e1'), evt('e2'), evt('e3')] });
  });

  it('returns ALL events when the route pool is empty', () => {
    useEditorRouteStore.getState().importState({ items: [route({ id: 'rAll', eventPoolIds: [] })] });
    useFlightStore.getState().setRoute('rAll');
    expect(getActiveEventPool().length).toBe(getFlightEvents().length);
    expect(getActiveEventPool().length).toBe(3);
  });

  it('filters to the route pool when non-empty', () => {
    useEditorRouteStore.getState().importState({ items: [route({ id: 'rOne', eventPoolIds: ['e2'] })] });
    useFlightStore.getState().setRoute('rOne');
    const pool = getActiveEventPool();
    expect(pool).toHaveLength(1);
    expect(pool[0].id).toBe('e2');
  });
});
