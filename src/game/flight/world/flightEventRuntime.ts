import { create } from 'zustand';
import type { FlightEventDef } from '../../../types/game/flightEvent';

// Live world-flight events. Events are STATIC world objects (placed ahead on the route; the craft flies
// past them), so there's no per-frame transform churn — they mount on spawn and unmount on resolve/expiry.
// Spawns/despawns are sparse (~1/sec), so a React-driven list is cheap; the heavy per-frame work (clouds,
// streaks) stays instanced. The director mutates ACTIVE_FLIGHT_EVENTS then bumps the version store so the
// renderer + sonar re-read it.
export interface ActiveFlightEvent {
  id: string; // unique instance id
  def: FlightEventDef;
  pos: [number, number, number];
  spawnU: number; // route U where it sits
  bornAt: number; // director elapsed seconds at spawn
  resolved: boolean;
}

export const ACTIVE_FLIGHT_EVENTS: ActiveFlightEvent[] = [];

export const useFlightEventVersion = create<{ v: number; bump: () => void }>((set) => ({
  v: 0,
  bump: () => set((s) => ({ v: s.v + 1 })),
}));

export function clearActiveFlightEvents(): void {
  ACTIVE_FLIGHT_EVENTS.length = 0;
  useFlightEventVersion.getState().bump();
}
