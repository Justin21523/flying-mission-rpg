import { computeRoadPath } from '../../types/traffic';
import type { RoadPath } from '../../types/traffic';

// POLI RPG — Brooms Town road paths.
// All paths are closed loops (computeRoadPath connects last waypoint back to first).
// Y=0.5 keeps vehicles slightly above the ground plane.
export const POLI_ROADS: RoadPath[] = [
  computeRoadPath('path_main_road', 'main_road', [
    [ 3, 0.5,  3],
    [ 8, 0.5,  0],
    [ 8, 0.5, -8],
    [ 3, 0.5, -10],
    [-3, 0.5, -10],
    [-8, 0.5, -8],
    [-8, 0.5,  0],
    [-3, 0.5,  3],
  ]),

  computeRoadPath('path_harbor', 'harbor_front', [
    [ 4, 0.5,  4],
    [ 4, 0.5, -5],
    [ 0, 0.5, -8],
    [-4, 0.5, -5],
    [-4, 0.5,  4],
  ]),

  computeRoadPath('path_school', 'school_district', [
    [ 3, 0.5,  2],
    [ 3, 0.5, -5],
    [-3, 0.5, -5],
    [-3, 0.5,  2],
  ]),
];
