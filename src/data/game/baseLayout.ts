import type { BasePart } from '../../types/game/base';

// Seed base layout (grey-box + the real hangar/station models where available). Positions form a small
// apron the vehicle taxis across toward the lift platform + launch tunnel at the back. Everything here is
// editable in Edit Mode (🏗 Base tab + gizmo). English labels.
export const BASE_SPAWN: [number, number, number] = [0, 1.2, 7];
export const BASE_HALF_EXTENT = 11; // enclosed room half-size (keeps the vehicle in)
export const BASE_GROUND_Y = 0;
export const BASE_CEILING_Y = 7; // enclosed ceiling height

export const SEED_BASE_PARTS: BasePart[] = [
  {
    id: 'base_hangar',
    kind: 'hangar',
    label: 'Main Hangar',
    assetId: 'super-wings/futuristic aircraft hangar 3d model',
    modelTarget: 16,
    position: [0, 0, -4],
    rotation: [0, 0, 0],
    scale: 1,
    size: [10, 6, 10],
    color: '#46506a',
    collision: 'none', // backdrop; bounds come from the perimeter walls
  },
  {
    id: 'base_apron',
    kind: 'apron',
    label: 'Apron',
    position: [0, 0.02, 3],
    rotation: [0, 0, 0],
    scale: 1,
    size: [26, 0.04, 26],
    color: '#39414f',
    collision: 'none',
  },
  {
    id: 'base_navline_c',
    kind: 'navline',
    label: 'Nav Line (centre)',
    position: [0, 0.05, 2],
    rotation: [0, 0, 0],
    scale: 1,
    size: [0.4, 0.02, 16],
    color: '#f5d142',
    collision: 'none',
  },
  {
    id: 'base_warnlight_l',
    kind: 'warning_light',
    label: 'Warning Light (L)',
    position: [-3.2, 0.5, -1],
    rotation: [0, 0, 0],
    scale: 1,
    size: [0.4, 1, 0.4],
    color: '#ff5a3c',
    collision: 'none',
  },
  {
    id: 'base_warnlight_r',
    kind: 'warning_light',
    label: 'Warning Light (R)',
    position: [3.2, 0.5, -1],
    rotation: [0, 0, 0],
    scale: 1,
    size: [0.4, 1, 0.4],
    color: '#ff5a3c',
    collision: 'none',
  },
  {
    id: 'base_lift',
    kind: 'lift_platform',
    label: 'Lift Platform',
    position: [0, 0.1, -1],
    rotation: [0, 0, 0],
    scale: 1,
    size: [4.5, 0.3, 4.5],
    color: '#8b93a6',
    collision: 'none',
  },
  {
    id: 'base_gate',
    kind: 'gate',
    label: 'Launch Gate',
    position: [0, 1.8, -9],
    rotation: [0, 0, 0],
    scale: 1,
    size: [5.5, 3.6, 0.4],
    color: '#5a6b88',
    collision: 'cuboid',
  },
  {
    id: 'base_tunnel',
    kind: 'tunnel_entrance',
    label: 'Launch Tunnel Entrance',
    position: [0, 1.8, -10.5],
    rotation: [0, 0, 0],
    scale: 1,
    size: [4.4, 3.4, 1.2],
    color: '#222a3a',
    collision: 'none',
  },
  {
    id: 'base_exit',
    kind: 'base_exit',
    label: 'Base Exterior Exit',
    position: [0, 1.4, 9.5],
    rotation: [0, 0, 0],
    scale: 1,
    size: [4, 2.8, 0.5],
    color: '#34d399',
    collision: 'none',
  },
];
