import type { PathDefinition, PathNodeData } from '../../types/path';

// The long-distance world-flight 航道 (a CatmullRom curve in editorPathStore, area 'world'). Editable in
// the 🛣 Tracks tab. Large abstract distances (no real-scale globe); pooling keeps memory flat regardless.
export const WORLD_PATH_ID = 'world_route';

const node = (id: string, p: [number, number, number]): PathNodeData => ({
  id,
  position: p,
  tangentMode: 'automatic',
  speedMultiplier: 1,
  width: 10,
});

const NODES: PathNodeData[] = [
  node('wr0', [0, 80, 0]),
  node('wr1', [1500, 95, -1200]),
  node('wr2', [3200, 115, -400]),
  node('wr3', [4800, 95, -2200]),
  node('wr4', [6500, 125, -1000]),
  node('wr5', [8200, 100, -3000]),
  node('wr6', [10000, 130, -1500]),
  node('wr7', [12000, 110, -3400]),
  node('wr8', [14000, 100, -2000]),
];

export const WORLD_PATH: PathDefinition = {
  id: WORLD_PATH_ID,
  name: 'World Route — Skyport → Bright City',
  areaId: 'world',
  nodeIds: NODES.map((n) => n.id),
  nodes: NODES,
  curveType: 'catmullRom',
  closed: false,
  defaultSpeed: 30,
  laneWidth: 10,
  directionMode: 'oneWay',
  entryNodeIds: ['wr0'],
  exitNodeIds: ['wr8'],
};
