import { Vector3 } from 'three';
import type { FlightEventDef, FlightEventKind } from '../../../types/game/flightEvent';

// The fixed, reusable flight-event pool — shared by the FlightEventLayer (director/renderer, writer) and
// the FlightSonarHud (reader, plots active events). A FIXED-size pool reused forever → flat object count.
export const FLIGHT_EVENT_POOL_SIZE = 14;

export type EventShape = 'ring' | 'orb' | 'column';

export const SHAPE_BY_KIND: Record<FlightEventKind, EventShape> = {
  cloud_hole: 'ring',
  stunt_ring: 'ring',
  rainbow: 'ring',
  formation: 'ring',
  collectible: 'orb',
  energy_refill: 'orb',
  radio: 'orb',
  lightning: 'orb',
  birds: 'orb',
  updraft: 'column',
  storm: 'column',
  crosswind: 'column',
  branch: 'orb',
};

export interface EventSlot {
  active: boolean;
  resolved: boolean;
  def: FlightEventDef | null;
  shape: EventShape;
  spawnU: number;
  bornAt: number;
  pos: Vector3;
}

export const FLIGHT_EVENT_POOL: EventSlot[] = Array.from({ length: FLIGHT_EVENT_POOL_SIZE }, () => ({
  active: false,
  resolved: false,
  def: null,
  shape: 'orb' as EventShape,
  spawnU: 0,
  bornAt: 0,
  pos: new Vector3(),
}));

export function resetFlightEventPool(): void {
  for (const s of FLIGHT_EVENT_POOL) {
    s.active = false;
    s.resolved = false;
    s.def = null;
  }
}
