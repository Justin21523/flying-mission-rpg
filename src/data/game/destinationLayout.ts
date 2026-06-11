import type { DestinationPart } from '../../types/game/destination';

// Seed destination — Sunny Harbor greybox (Batch 7 vertical slice). One landing zone + safe zone, a main
// road, building placeholders, the three mission objects (carry → dropoff, lost item, repair device),
// boundary and markers. All gizmo-editable in the 🏙 Destination tab; objectives reference the part ids.
export const DESTINATION_BOUNDARY_HALF = 90; // fallback play-area half-extent

export const SEED_DESTINATION_PARTS: DestinationPart[] = [
  { id: 'dst_spawn_air', kind: 'spawn_air', label: 'Descent Start (air)', position: [0, 80, 0], rotation: [0, 0, 0], scale: 1, size: [2, 2, 2], color: '#22d3ee', enabled: true },
  { id: 'dst_landing', kind: 'landing_zone', label: 'Landing Pad', position: [0, 0, 0], rotation: [0, 0, 0], scale: 1, size: [10, 0.2, 10], radius: 9, color: '#34d399', enabled: true },
  { id: 'dst_safe', kind: 'safe_zone', label: 'Safe Zone (plaza)', position: [16, 0, 8], rotation: [0, 0, 0], scale: 1, size: [14, 0.1, 14], radius: 12, color: '#a7f3d0', enabled: true },
  { id: 'dst_road', kind: 'road', label: 'Harbor Road', position: [0, 0.02, 24], rotation: [0, 0, 0], scale: 1, size: [8, 0.05, 60], color: '#475569', enabled: true },

  // building placeholders around the plaza
  { id: 'dst_b1', kind: 'building', label: 'Harbor House 1', position: [-22, 0, -10], rotation: [0, 0, 0], scale: 1, size: [10, 12, 10], color: '#7c8db0', enabled: true },
  { id: 'dst_b2', kind: 'building', label: 'Harbor House 2', position: [-24, 0, 14], rotation: [0, 20, 0], scale: 1, size: [8, 9, 8], color: '#8d9bb8', enabled: true },
  { id: 'dst_b3', kind: 'building', label: 'Warehouse', position: [26, 0, -14], rotation: [0, 0, 0], scale: 1, size: [16, 8, 10], color: '#64748b', enabled: true },
  { id: 'dst_b4', kind: 'building', label: 'Post Office', position: [30, 0, 16], rotation: [0, -15, 0], scale: 1, size: [10, 10, 10], color: '#94a3b8', enabled: true },
  { id: 'dst_b5', kind: 'building', label: 'Lighthouse Base', position: [-6, 0, -34], rotation: [0, 0, 0], scale: 1, size: [6, 16, 6], color: '#cbd5e1', enabled: true },
  { id: 'dst_b6', kind: 'building', label: 'Cafe', position: [10, 0, -26], rotation: [0, 10, 0], scale: 1, size: [8, 6, 8], color: '#9aa8c2', enabled: true },
  { id: 'dst_b7', kind: 'building', label: 'Boat Shed', position: [-32, 0, 36], rotation: [0, 0, 0], scale: 1, size: [12, 6, 8], color: '#6e7d99', enabled: true },
  { id: 'dst_b8', kind: 'building', label: 'Market Stall', position: [18, 0, 36], rotation: [0, 30, 0], scale: 1, size: [6, 4, 6], color: '#a3b0c8', enabled: true },

  // mission objects (objectives reference these ids)
  { id: 'dst_parcel', kind: 'carry_item', label: 'Parcel', position: [-14, 0.5, 20], rotation: [0, 0, 0], scale: 1, size: [1.2, 1.2, 1.2], radius: 3.5, color: '#f59e0b', enabled: true, linkedObjectiveId: 'obj_carry_parcel' },
  { id: 'dst_dropoff', kind: 'dropoff_zone', label: 'Post Office Dropoff', position: [30, 0, 8], rotation: [0, 0, 0], scale: 1, size: [6, 0.1, 6], radius: 5, color: '#fbbf24', enabled: true, linkedObjectiveId: 'obj_carry_parcel' },
  { id: 'dst_lost_cap', kind: 'lost_item', label: 'Lost Cap', position: [-28, 0.4, -24], rotation: [0, 0, 0], scale: 1, size: [0.9, 0.5, 0.9], radius: 3.5, color: '#f472b6', enabled: true, linkedObjectiveId: 'obj_find_cap' },
  { id: 'dst_beacon', kind: 'repair_device', label: 'Harbor Beacon', position: [-6, 0, -28], rotation: [0, 0, 0], scale: 1, size: [2, 3, 2], radius: 4, color: '#38bdf8', enabled: true, linkedObjectiveId: 'obj_fix_beacon', miniGameId: 'repair_wiring' },

  { id: 'dst_boundary', kind: 'boundary', label: 'Harbor Boundary', position: [0, 0, 0], rotation: [0, 0, 0], scale: 1, size: [90, 40, 90], color: '#475569', enabled: true },
  { id: 'dst_marker_npc', kind: 'marker', label: 'Greeting Spot', position: [8, 0, 4], rotation: [0, 0, 0], scale: 1, size: [1, 1, 1], color: '#fde047', enabled: true },
];
