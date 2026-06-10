import { nanoid } from 'nanoid';
import { createEditorCollection } from './createEditorCollection';
import type { FlightRoute } from '../../types/game/flight';
import { SEED_ROUTES } from '../../data/game/routes';

export const useEditorRouteStore = createEditorCollection<FlightRoute>({
  storageKey: 'aero-rescue-editor-route-v4',
  seed: SEED_ROUTES,
  makeId: () => `route_${nanoid(6)}`,
});

export function getEditorRoutes(): FlightRoute[] {
  return useEditorRouteStore.getState().items;
}
export function getEditorRoute(id: string): FlightRoute | undefined {
  return useEditorRouteStore.getState().items.find((r) => r.id === id);
}
