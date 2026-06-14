import type { ExteriorPart } from '../../types/game/exterior';

// Seed exterior + flight route. The craft emerges at flight_spawn, flies the navpoint loop around the
// tower (BASE_FLY_AROUND), then up through the ascent navpoints to the sky gate (CLOUD_ASCENT). All
// gizmo-editable in the 🗼 Exterior tab.
export const FLIGHT_BOUNDARY_FALLBACK = 240;

export const SEED_EXTERIOR_PARTS: ExteriorPart[] = [
  { id: 'ext_spawn', kind: 'flight_spawn', label: 'Flight Spawn (tunnel exit)', position: [0, 26, 60], rotation: [0, 0, 0], scale: 1, size: [2, 1, 3], color: '#22d3ee', collision: 'none' },
  { id: 'ext_tower', kind: 'center_tower', label: 'Space Station Base', assetId: 'aero-mission/futuristic space station 3d model', modelTarget: 70, position: [0, 10, 0], rotation: [0, 0, 0], scale: 1, size: [7, 56, 7], color: '#5a6478', collision: 'none' },
  { id: 'ext_ring', kind: 'ring', label: 'Outer Ring', position: [0, 22, 0], rotation: [0, 0, 0], scale: 1, size: [30, 1.2, 30], color: '#7c8db0', collision: 'none' },
  { id: 'ext_skygate', kind: 'sky_gate', label: 'Sky Gate (high-altitude entrance)', position: [0, 78, 0], rotation: [0, 0, 0], scale: 1, size: [10, 1.5, 10], color: '#fbbf24', collision: 'none' },
  { id: 'ext_cloud0', kind: 'cloud', label: 'Cloud 0', position: [30, 38, -20], rotation: [0, 0, 0], scale: 2.4, size: [1, 1, 1], color: '#ffffff', collision: 'none' },
  { id: 'ext_cloud1', kind: 'cloud', label: 'Cloud 1', position: [-26, 52, 14], rotation: [0, 0, 0], scale: 2.8, size: [1, 1, 1], color: '#eef2ff', collision: 'none' },
  { id: 'ext_cloud2', kind: 'cloud', label: 'Cloud 2', position: [10, 60, -8], rotation: [0, 0, 0], scale: 3.2, size: [1, 1, 1], color: '#ffffff', collision: 'none' },
];
