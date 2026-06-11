// Editable destination-scene layout (Batch 7) — landing zones, buildings, roads, mission objects, NPC
// markers and boundaries, all gizmo-draggable in the 🏙 Destination tab (no hardcoded positions). Mission
// objects are referenced by Objective definitions via their part id.
export type DestinationPartKind =
  | 'building'
  | 'road'
  | 'landing_zone'
  | 'safe_zone'
  | 'spawn_air' // where the descent starts (in the sky above the layout)
  | 'support_spawn'
  | 'dropoff_zone'
  | 'carry_item'
  | 'lost_item'
  | 'repair_device'
  | 'marker'
  | 'boundary';

export const DESTINATION_PART_KINDS: readonly DestinationPartKind[] = [
  'building',
  'road',
  'landing_zone',
  'safe_zone',
  'spawn_air',
  'support_spawn',
  'dropoff_zone',
  'carry_item',
  'lost_item',
  'repair_device',
  'marker',
  'boundary',
];

export interface DestinationPart {
  id: string;
  kind: DestinationPartKind;
  label: string;
  assetId?: string; // optional GLB (empty = primitive)
  modelTarget?: number;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  size: [number, number, number]; // box size; boundary = half-extents footprint
  radius?: number; // landing/safe/dropoff zone radius + interaction radius for items/devices
  color: string;
  enabled: boolean;
  linkedObjectiveId?: string; // mission objects → the objective that references them
  miniGameId?: string; // repair_device → which Phaser mini-game to open
}
