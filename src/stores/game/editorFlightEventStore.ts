import { nanoid } from 'nanoid';
import { createEditorCollection } from './createEditorCollection';
import type { FlightEventDef } from '../../types/game/flightEvent';
import { SEED_FLIGHT_EVENTS } from '../../data/game/flightEvents';

// Editable flight-event pool (🌩 Events tab). The world-flight director spawns from a route's selected
// events. Reuses the collection factory (localStorage + import/reset + mergeMissingFromSeed).
export const useEditorFlightEventStore = createEditorCollection<FlightEventDef>({
  storageKey: 'aero-rescue-editor-flightevent-v1',
  seed: SEED_FLIGHT_EVENTS,
  makeId: () => `fe_${nanoid(6)}`,
});

export function getFlightEvents(): FlightEventDef[] {
  return useEditorFlightEventStore.getState().items;
}
export function getFlightEvent(id: string): FlightEventDef | undefined {
  return useEditorFlightEventStore.getState().items.find((e) => e.id === id);
}
