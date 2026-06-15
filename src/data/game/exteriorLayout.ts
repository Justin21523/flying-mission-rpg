import type { ExteriorPart } from '../../types/game/exterior';

// Seed exterior + flight route. The craft emerges at flight_spawn, flies the navpoint loop around the
// tower (BASE_FLY_AROUND), then up through the ascent navpoints to the sky gate (CLOUD_ASCENT). All
// gizmo-editable in the 🗼 Exterior tab.
export const FLIGHT_BOUNDARY_FALLBACK = 240;

// The base is GROUND-STANDING: the ground-catch plane sits at y=0, a wide landing plaza rests on it, and the
// station's feet sit at y=0 (NormalizedGlbModel drops a model's feet to its group origin). Decorative clouds
// live in a HIGH sky layer above the station top (~y70) and above the flight path (max y80), so the base never
// looks like it's floating in the clouds. All gizmo-editable + extendable in the 🗼 Exterior tab (➕ Add).
export const SEED_EXTERIOR_PARTS: ExteriorPart[] = [
  { id: 'ext_spawn', kind: 'flight_spawn', label: 'Flight Spawn (tunnel exit)', position: [0, 26, 60], rotation: [0, 0, 0], scale: 1, size: [2, 1, 3], color: '#22d3ee', collision: 'none' },
  // Ground plaza the base stands on (top face at y=0) — also a flat surface to build on in Edit Mode.
  { id: 'ext_ground_pad', kind: 'structure', label: 'Base Ground Plaza', position: [0, -1, 0], rotation: [0, 0, 0], scale: 1, size: [110, 2, 110], color: '#39424f', collision: 'none' },
  { id: 'ext_tower', kind: 'center_tower', label: 'Space Station Base', assetId: 'super-wings/futuristic space station 3d model', modelTarget: 70, position: [0, 0, 0], rotation: [0, 0, 0], scale: 1, size: [7, 56, 7], color: '#5a6478', collision: 'none' },
  // Ground landing ring around the base (lowered so it reads as ground infrastructure, not levitating).
  { id: 'ext_ring', kind: 'ring', label: 'Ground Landing Ring', position: [0, 1, 0], rotation: [0, 0, 0], scale: 1, size: [30, 1.2, 30], color: '#7c8db0', collision: 'none' },
  { id: 'ext_skygate', kind: 'sky_gate', label: 'Sky Gate (high-altitude entrance)', position: [0, 78, 0], rotation: [0, 0, 0], scale: 1, size: [10, 1.5, 10], color: '#fbbf24', collision: 'none' },
  { id: 'ext_cloud0', kind: 'cloud', label: 'Sky Cloud 0', position: [60, 105, -45], rotation: [0, 0, 0], scale: 3.2, size: [1, 1, 1], color: '#ffffff', collision: 'none' },
  { id: 'ext_cloud1', kind: 'cloud', label: 'Sky Cloud 1', position: [-55, 120, 40], rotation: [0, 0, 0], scale: 3.6, size: [1, 1, 1], color: '#eef2ff', collision: 'none' },
  { id: 'ext_cloud2', kind: 'cloud', label: 'Sky Cloud 2', position: [25, 130, 0], rotation: [0, 0, 0], scale: 4, size: [1, 1, 1], color: '#ffffff', collision: 'none' },
];
