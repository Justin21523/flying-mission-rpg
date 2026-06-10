import type { PathDefinition, PathNodeData } from '../../types/path';
import type { BoostPadConfig } from '../../types/boostPad';

// Phase B — test content for the BoostPad + PathFollow systems, seeded into the starting area (rescue_hq):
// one STRAIGHT path and one CURVED path, each fronted by a BoostPad that flings the player onto it. Editors
// (Phase D) let you author more; these merge in as defaults and round-trip through localStorage like every
// other POLI content store.
const AREA = 'rescue_hq';

function node(id: string, position: [number, number, number]): PathNodeData {
  return { id, position, tangentMode: 'automatic', speedMultiplier: 1, width: 2 };
}

const STRAIGHT_NODES: PathNodeData[] = [
  node('straight_0', [10, 0.3, 0]),
  node('straight_1', [25, 0.3, 0]),
  node('straight_2', [42, 0.3, 0]),
];

const CURVE_NODES: PathNodeData[] = [
  node('curve_0', [10, 0.3, 12]),
  node('curve_1', [22, 0.3, 20]),
  node('curve_2', [34, 0.3, 14]),
  node('curve_3', [44, 0.3, 26]),
  node('curve_4', [52, 0.3, 16]),
];

// Brooms Town — 中央大道 (Central Avenue): a gently winding street through main_road that vehicle convoys drive.
const MAIN_ROAD_NODES: PathNodeData[] = [
  node('mainroad_0', [0, 0.3, -28]),
  node('mainroad_1', [6, 0.3, -12]),
  node('mainroad_2', [-4, 0.3, 4]),
  node('mainroad_3', [4, 0.3, 20]),
  node('mainroad_4', [0, 0.3, 30]),
];

export const PATH_SEED: PathDefinition[] = [
  {
    id: 'path_test_straight',
    name: 'HQ 演練直線道',
    areaId: AREA,
    nodeIds: STRAIGHT_NODES.map((n) => n.id),
    nodes: STRAIGHT_NODES,
    curveType: 'catmullRom',
    closed: false,
    defaultSpeed: 14,
    laneWidth: 2,
    directionMode: 'oneWay',
    entryNodeIds: ['straight_0'],
    exitNodeIds: ['straight_2'],
  },
  {
    id: 'path_test_curve',
    name: 'HQ 演練彎道',
    areaId: AREA,
    nodeIds: CURVE_NODES.map((n) => n.id),
    nodes: CURVE_NODES,
    curveType: 'catmullRom',
    closed: false,
    defaultSpeed: 12,
    laneWidth: 2.5,
    directionMode: 'oneWay',
    entryNodeIds: ['curve_0'],
    exitNodeIds: ['curve_4'],
  },
  {
    id: 'path_main_road',
    name: '中央大道',
    areaId: 'main_road',
    nodeIds: MAIN_ROAD_NODES.map((n) => n.id),
    nodes: MAIN_ROAD_NODES,
    curveType: 'catmullRom',
    closed: false,
    defaultSpeed: 10,
    laneWidth: 3,
    directionMode: 'twoWay',
    entryNodeIds: ['mainroad_0'],
    exitNodeIds: ['mainroad_4'],
  },
];

export const BOOST_PAD_SEED: BoostPadConfig[] = [
  {
    id: 'pad_test_straight',
    enabled: true,
    boostMode: 'pathDirection',
    boostSpeed: 18,
    acceleration: 40,
    duration: 4,
    cooldown: 1.5,
    linkedPathId: 'path_test_straight',
    enterPathFollow: true,
    pathControlMode: 'forwardLocked',
    exitBehavior: 'continueMomentum',
    areaId: AREA,
    position: [6, 0.3, 0],
    rotation: [0, Math.PI / 2, 0], // local +Z faces +X, toward the straight path's entry
  },
  {
    id: 'pad_test_curve',
    enabled: true,
    boostMode: 'pathDirection',
    boostSpeed: 16,
    acceleration: 40,
    duration: 4,
    cooldown: 1.5,
    linkedPathId: 'path_test_curve',
    enterPathFollow: true,
    pathControlMode: 'fullyAutomatic',
    exitBehavior: 'releaseControl',
    areaId: AREA,
    position: [6, 0.3, 12],
    rotation: [0, Math.PI / 2, 0],
  },
];
