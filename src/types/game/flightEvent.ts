import type { SourceConfidence } from '../sourceConfidence';

// Authored flight-event archetypes for the world-flight director (PDF §批次5). Child-friendly, no combat;
// "encounters" are re-themed as non-combat flight incidents. Editable in the 🌩 Events tab.
export type FlightEventKind =
  | 'cloud_hole'
  | 'crosswind'
  | 'updraft'
  | 'storm'
  | 'lightning'
  | 'rainbow'
  | 'birds'
  | 'energy_refill'
  | 'stunt_ring'
  | 'collectible'
  | 'radio'
  | 'formation'
  | 'branch';

export const FLIGHT_EVENT_KINDS: readonly FlightEventKind[] = [
  'cloud_hole',
  'crosswind',
  'updraft',
  'storm',
  'lightning',
  'rainbow',
  'birds',
  'energy_refill',
  'stunt_ring',
  'collectible',
  'radio',
  'formation',
  'branch',
];

export interface FlightEventDef {
  id: string;
  kind: FlightEventKind;
  label: string;
  weight: number; // relative spawn likelihood
  minGapSec: number; // min seconds since the last event before this can spawn (no overlap)
  lateralRange: number; // how far off the route centre it can appear (world units)
  color: string;
  size: number;
  durationSec: number; // how long it lingers before recycling
  driftSpeed?: number; // gentle world-units/sec drift (movement param — birds/formation/wisps)
  modelAssetId?: string; // optional GLB placeholder (empty = built-in primitive visual for the kind)
  radioText?: string; // for 'radio' events
  value?: number; // collectible/energy amount
  sourceConfidence: SourceConfidence;
}
