import { createEditorCollection } from './createEditorCollection';
import type { FlightPolishPreset } from '../../types/game/flightPolish';
import { ALL_FLIGHT_POLISH_PRESETS } from '../../game/flight/effects/FlightEffectPresets';

// Batch 12 — authored flight polish presets (🛩✨ Flight Polish tab). Seeded from the sunny/storm/sunset
// presets; the flight effect controller reads the active one (by route sky preset) from here.
export const useEditorFlightPolishStore = createEditorCollection<FlightPolishPreset>({
  storageKey: 'aero-rescue-editor-flightpolish-v1',
  seed: ALL_FLIGHT_POLISH_PRESETS,
  makeId: () => `flightpolish_${Date.now().toString(36)}`,
});

export function getEditorFlightPolishPresets(): FlightPolishPreset[] {
  return useEditorFlightPolishStore.getState().items;
}

export function getEditorFlightPolishPreset(id: string): FlightPolishPreset | undefined {
  return useEditorFlightPolishStore.getState().items.find((p) => p.id === id);
}
