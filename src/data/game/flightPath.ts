import type { PathDefinition, PathNodeData } from '../../types/path';

// The guided fly-around + ascent route (reuses POLI's PathDefinition / CatmullRom curve). The craft
// auto-follows this (hold forward) during BASE_FLY_AROUND → CLOUD_ASCENT. Editable in the 🛣 Tracks tab
// (drag nodes, change mode/closed). Loop around the base, then climb to the sky gate.
export const FLIGHT_PATH_ID = 'flight_around';

const node = (id: string, p: [number, number, number]): PathNodeData => ({
  id,
  position: p,
  tangentMode: 'automatic',
  speedMultiplier: 1,
  width: 6,
});

const NODES: PathNodeData[] = [
  node('fp0', [0, 26, 52]),
  node('fp1', [42, 27, 8]),
  node('fp2', [30, 28, -38]),
  node('fp3', [-30, 28, -38]),
  node('fp4', [-42, 27, 8]),
  node('fp5', [0, 30, 46]), // completed the loop near the start
  node('fp6', [0, 46, 14]), // begin ascent
  node('fp7', [0, 62, 0]),
  node('fp8', [0, 78, 0]), // sky gate
];

export const FLIGHT_PATH: PathDefinition = {
  id: FLIGHT_PATH_ID,
  name: 'Flight — base loop + ascent',
  areaId: 'exterior', // scopes PathDebugLayer to the flight scene
  nodeIds: NODES.map((n) => n.id),
  nodes: NODES,
  curveType: 'catmullRom',
  closed: false,
  defaultSpeed: 26,
  laneWidth: 6,
  directionMode: 'oneWay',
  entryNodeIds: ['fp0'],
  exitNodeIds: ['fp8'],
};
