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
  minGapSec: number; // cooldown — min seconds since THIS event last spawned before it can spawn again
  lateralRange: number; // how far off the route centre it can appear (world units)
  color: string;
  size: number;
  durationSec: number; // how long it lingers before recycling
  driftSpeed?: number; // gentle world-units/sec drift (movement param — birds/formation/wisps)
  modelAssetId?: string; // optional GLB placeholder (empty = built-in primitive visual for the kind)
  radioText?: string; // for 'radio' events
  value?: number; // collectible/energy amount
  // ── director gating (Batch 5) ──
  minRouteProgress?: number; // 0..1 — earliest point on the route it may appear (default 0)
  maxRouteProgress?: number; // 0..1 — latest point (default 1)
  minAltitude?: number;
  maxAltitude?: number;
  canOverlapWith?: FlightEventKind[]; // kinds it may coexist with (undefined = overlaps anything)
  blocking?: boolean; // navigation-affecting — only a limited number may be active at once
  sourceConfidence: SourceConfidence;
}
