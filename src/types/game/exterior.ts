// Editable layout of the base EXTERIOR + flight route markers (Edit Mode 🗼 Exterior tab; gizmo-
// draggable). Per the no-hardcoded rule, the flight spawn, navpoints, tower, ring, sky gate and clouds
// are all data the user can place/tune.
export type ExteriorKind =
  | 'flight_spawn' // where the craft enters open flight (launch-tunnel exit)
  | 'center_tower'
  | 'ring'
  | 'navpoint' // guidance marker (uses `order`)
  | 'sky_gate' // high-altitude entrance (end of the ascent)
  | 'cloud'
  | 'structure';

export const EXTERIOR_KINDS: readonly ExteriorKind[] = [
  'flight_spawn',
  'center_tower',
  'ring',
  'navpoint',
  'sky_gate',
  'cloud',
  'structure',
];

export type ExteriorCollision = 'none' | 'cuboid' | 'hull' | 'trimesh';

export interface ExteriorPart {
  id: string;
  kind: ExteriorKind;
  label: string;
  assetId?: string;
  modelTarget?: number;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  size: [number, number, number];
  color: string;
  collision: ExteriorCollision;
  order?: number; // navpoint sequence (lower = earlier)
}
