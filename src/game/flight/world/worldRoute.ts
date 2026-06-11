import { useMissionStore } from '../../../stores/game/useMissionStore';
import { useFlightStore } from '../../../stores/game/useFlightStore';
import { getEditorMission } from '../../../stores/game/editorMissionStore';
import { getEditorRoute, getEditorRoutes } from '../../../stores/game/editorRouteStore';
import { getFlightEvents } from '../../../stores/game/editorFlightEventStore';
import { WORLD_PATH_ID } from '../../../data/game/worldRoutes';
import type { FlightRoute } from '../../../types/game/flight';
import type { FlightEventDef } from '../../../types/game/flightEvent';

// The route the world-flight runtime is currently flying: the active mission's route, else the first
// authored route. Shared by RouteFollower, the event director, and the HUDs so they all agree.
export function getActiveRoute(): FlightRoute | undefined {
  const overrideId = useFlightStore.getState().currentRouteId;
  const override = overrideId ? getEditorRoute(overrideId) : undefined;
  if (override) return override;
  const mId = useMissionStore.getState().currentMissionId;
  const m = mId ? getEditorMission(mId) : undefined;
  const r = m?.routeId ? getEditorRoute(m.routeId) : undefined;
  return r ?? getEditorRoutes()[0];
}

export function getActivePathId(): string {
  return getActiveRoute()?.pathId ?? WORLD_PATH_ID;
}

// The flight-event pool the active route allows the director to spawn (its eventPoolIds; empty = all).
export function getActiveEventPool(): FlightEventDef[] {
  const route = getActiveRoute();
  const all = getFlightEvents();
  if (!route || route.eventPoolIds.length === 0) return all;
  const allow = new Set(route.eventPoolIds);
  return all.filter((e) => allow.has(e.id));
}
