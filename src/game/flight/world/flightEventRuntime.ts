import { create } from 'zustand';
import type { FlightEventDef, FlightEventKind } from '../../../types/game/flightEvent';

// Live world-flight events. Events are STATIC world objects (placed ahead on the route; the craft flies
// past them), so there's no per-frame transform churn — they mount on spawn and unmount on resolve/expiry.
// Spawns/despawns are sparse (~1/sec), so a React-driven list is cheap; the heavy per-frame work (clouds,
// streaks) stays instanced. The director mutates ACTIVE_FLIGHT_EVENTS then bumps the version store so the
// renderer + sonar re-read it.

// Lifecycle (PDF §批次5): scheduled → active → resolving → completed → disposed (removed from the array).
export type FlightEventState = 'scheduled' | 'active' | 'resolving' | 'completed';

export interface ActiveFlightEvent {
  id: string; // unique instance id (runtimeId)
  def: FlightEventDef;
  pos: [number, number, number];
  spawnU: number; // route U where it sits
  segmentId?: string; // the route segment it spawned in
  bornAt: number; // director elapsed seconds at spawn
  state: FlightEventState;
  resolved: boolean;
  golden?: boolean; // rare upgraded pickup — bigger reward + gold celebration
}

export const ACTIVE_FLIGHT_EVENTS: ActiveFlightEvent[] = [];

// Director debug snapshot (read by WorldFlightDebugPanel). Updated each tick by the director host.
export interface FlightDirectorDebug {
  routeId: string;
  progress: number;
  segmentId: string;
  cooldowns: { id: string; remaining: number }[];
  lastRejected: string | null;
}
export const flightDirectorDebug: FlightDirectorDebug = {
  routeId: '',
  progress: 0,
  segmentId: '',
  cooldowns: [],
  lastRejected: null,
};

export const useFlightEventVersion = create<{ v: number; bump: () => void }>((set) => ({
  v: 0,
  bump: () => set((s) => ({ v: s.v + 1 })),
}));

export function activeBlockingCount(): number {
  let n = 0;
  for (const e of ACTIVE_FLIGHT_EVENTS) if (e.def.blocking) n++;
  return n;
}

export function activeKinds(): FlightEventKind[] {
  return ACTIVE_FLIGHT_EVENTS.map((e) => e.def.kind);
}

export function clearActiveFlightEvents(): void {
  ACTIVE_FLIGHT_EVENTS.length = 0;
  flightDirectorDebug.cooldowns = [];
  flightDirectorDebug.lastRejected = null;
  useFlightEventVersion.getState().bump();
}

// Sparse helper so a renderer can declare a stable event-def even when only id matters.
export type { FlightEventDef };
