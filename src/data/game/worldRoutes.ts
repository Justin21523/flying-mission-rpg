import type { PathDefinition, PathNodeData } from '../../types/path';

// The long-distance world-flight 航道 curves (CatmullRom paths in editorPathStore, area 'world'). Editable
// in the 🛣 Tracks tab (and reset there). Large abstract distances (no real-scale globe); pooling keeps
// memory flat regardless.
export const WORLD_PATH_ID = 'world_route'; // primary (Sunny Harbor)
export const MOUNTAIN_PATH_ID = 'world_route_mountain';
export const STORM_PATH_ID = 'world_route_storm';

const node = (id: string, p: [number, number, number]): PathNodeData => ({
  id,
  position: p,
  tangentMode: 'automatic',
  speedMultiplier: 1,
  width: 10,
});

function makePath(id: string, name: string, pts: [number, number, number][]): PathDefinition {
  const nodes = pts.map((p, i) => node(`${id}_n${i}`, p));
  return {
    id,
    name,
    areaId: 'world',
    nodeIds: nodes.map((n) => n.id),
    nodes,
    curveType: 'catmullRom',
    closed: false,
    defaultSpeed: 30,
    laneWidth: 10,
    directionMode: 'oneWay',
    entryNodeIds: [nodes[0].id],
    exitNodeIds: [nodes[nodes.length - 1].id],
  };
}

// Primary route — gentle rolling cruise toward Sunny Harbor.
export const WORLD_PATH = makePath('world_route', 'World Route — Skyport → Sunny Harbor', [
  [0, 80, 0],
  [1500, 95, -1200],
  [3200, 115, -400],
  [4800, 95, -2200],
  [6500, 125, -1000],
  [8200, 100, -3000],
  [10000, 130, -1500],
  [12000, 110, -3400],
  [14000, 100, -2000],
]);

// Mountain route — higher, gustier passes with sharper turns.
export const MOUNTAIN_PATH = makePath('world_route_mountain', 'World Route — Skyport → Mountain Festival Town', [
  [0, 90, 0],
  [1400, 140, 900],
  [3000, 180, 200],
  [4600, 210, 1600],
  [6200, 240, 700],
  [7800, 200, 2200],
  [9600, 250, 1200],
  [11400, 220, 2600],
]);

// Storm route — lower, jagged coastal run under heavy weather.
export const STORM_PATH = makePath('world_route_storm', 'World Route — Skyport → Storm Coast', [
  [0, 75, 0],
  [1300, 70, -900],
  [2700, 85, -300],
  [4200, 60, -1500],
  [5800, 80, -700],
  [7400, 55, -1900],
  [9200, 75, -1100],
  [11000, 60, -2100],
]);

export const ALL_WORLD_PATHS: PathDefinition[] = [WORLD_PATH, MOUNTAIN_PATH, STORM_PATH];
