import type {
  FlightCameraKeyframe, FlightPathNode, FlightPhaseConfig, FlightPose, FlightTimelineEvent,
} from '../../types/game/flightPhase';
import type { Vec3Tuple } from '../../types/path';
import { WORLD_PATH } from './worldRoutes';
import { routeToFlightPath } from '../../game/flight/routeToFlightPhase';

// Default "Base Orbit" flight phase — fly out of the base, orbit it once, climb for a panorama, turn toward
// the mission and boost away. Fully editable in Edit Mode (seeded into flightPhaseStore; drag/edit/focus/
// add/delete/duplicate/reorder nodes, author camera keyframes + timeline events). The single source of truth
// for the base-exterior fly-around scene — derived totals are recomputed by flightPhaseRuntime on load.
export const BASE_ORBIT_PHASE_ID = 'flight_base_orbit';
export const BASE_ORBIT_PATH_ID = 'flight_base_orbit_path';

const node = (
  nodeId: string,
  nodeName: string,
  position: Vec3Tuple,
  speed: number,
  pose: FlightPose,
  extra: Partial<FlightPathNode> = {},
): FlightPathNode => ({
  nodeId,
  nodeName,
  position,
  rotation: [0, 0, 0],
  speed,
  waitTime: 0,
  bankingAngle: 0,
  influenceRadius: 10,
  flightPose: pose,
  eventIds: [],
  ...extra,
});

const NODES: FlightPathNode[] = [
  node('n_takeoff', 'Takeoff_From_Base', [0, 16, 40], 14, 'climb'),
  node('n_gate', 'Exit_Base_Gate', [0, 22, 58], 20, 'climb'),
  node('n_front', 'Front_Orbit_Point', [0, 32, 50], 24, 'level'),
  node('n_left', 'Left_Orbit_Point', [-50, 32, 2], 26, 'bankLeft', { bankingAngle: 14 }),
  node('n_back', 'Back_Orbit_Point', [0, 33, -50], 26, 'turn'),
  node('n_right', 'Right_Orbit_Point', [50, 32, 2], 26, 'bankRight', { bankingAngle: -14 }),
  node('n_high', 'High_Aerial_View_Point', [6, 66, 34], 18, 'climb', { waitTime: 1.5, altitude: 66 }),
  node('n_turn', 'Mission_Direction_Turn', [40, 58, -24], 22, 'turn'),
  node('n_boost', 'Boost_Exit_Point', [150, 80, -120], 60, 'level'),
];

const CAMERA_KEYS: FlightCameraKeyframe[] = [
  { keyframeId: 'cam_launch', time: 0, position: [0, 22, 78], rotation: [0, 0, 0], fov: 55, transitionType: 'easeInOut', followTargetId: 'craft' },
  { keyframeId: 'cam_reveal', time: 6, position: [70, 50, 80], rotation: [0, 0, 0], lookAtTarget: [0, 30, 0], fov: 50, transitionType: 'easeInOut' },
  { keyframeId: 'cam_aerial', time: 12, position: [40, 96, 60], rotation: [0, 0, 0], lookAtTarget: [0, 30, 0], fov: 46, transitionType: 'easeInOut' },
  { keyframeId: 'cam_boost', time: 18, position: [0, 24, 78], rotation: [0, 0, 0], fov: 62, transitionType: 'easeOut', followTargetId: 'craft' },
];

const ev = (eventId: string, time: number, eventType: FlightTimelineEvent['eventType'], payload: Record<string, unknown> = {}): FlightTimelineEvent => ({
  eventId, time, eventType, payload, previewEnabled: true, triggerOnce: true, enabled: true,
});

const EVENTS: FlightTimelineEvent[] = [
  ev('ev_brief', 0.5, 'missionBriefing', { text: 'Heading out — fly around the base, then climb to ascend.' }),
  ev('ev_panorama', 6, 'basePanorama', {}),
  ev('ev_trail', 13, 'trailFx', { color: '#38bdf8' }),
  ev('ev_boost', 18, 'boostFx', {}),
  // Progression in play is the player's CLIMB (altitude gate), not a timed jump — left disabled as an example.
  { ...ev('ev_next', 21, 'nextPhase', { phase: 'CLOUD_ASCENT' }), enabled: false },
];

export const BASE_ORBIT_PHASE: FlightPhaseConfig = {
  phaseId: BASE_ORBIT_PHASE_ID,
  phaseName: 'Base Orbit',
  phaseType: 'baseOrbit',
  gamePhase: 'BASE_FLY_AROUND',
  baseId: 'skyport',
  pathId: BASE_ORBIT_PATH_ID,
  path: {
    pathId: BASE_ORBIT_PATH_ID,
    pathName: 'Base orbit route',
    curveType: 'catmullRom',
    nodes: NODES,
    closedLoop: false,
    previewResolution: 64,
    totalDistance: 0, // derived on load
    totalDuration: 0, // derived on load
  },
  totalDuration: 0, // derived on load
  startMode: 'fromBaseGate',
  endMode: 'nextPhase',
  loopPreview: true,
  cameraKeyframes: CAMERA_KEYS,
  events: EVENTS,
  editableInEditMode: true,
};

// Aerial / mission-travel + return legs — seeded by converting the existing world routes so play follows the
// same geometry, now editable with the unified Flight Editor. Camera/events default empty (follow camera).
const aerialPath = routeToFlightPath(WORLD_PATH, 'flight_aerial_path', 'Aerial cruise — to mission');
const returnPath = routeToFlightPath(WORLD_PATH, 'flight_return_path', 'Return leg — to base', true);

export const AERIAL_CRUISE_PHASE: FlightPhaseConfig = {
  phaseId: 'flight_aerial_cruise',
  phaseName: 'Aerial Cruise',
  phaseType: 'aerialCruise',
  gamePhase: 'WORLD_FLIGHT',
  baseId: 'skyport',
  pathId: aerialPath.pathId,
  path: aerialPath,
  totalDuration: 0,
  startMode: 'atFirstNode',
  endMode: 'nextPhase',
  loopPreview: false,
  cameraKeyframes: [],
  events: [
    ev('aev_brief', 1, 'missionBriefing', { text: 'Cruising to the mission zone — hold W to advance, A/D to steer.' }),
  ],
  editableInEditMode: true,
};

export const RETURN_LEG_PHASE: FlightPhaseConfig = {
  phaseId: 'flight_return_leg',
  phaseName: 'Return Leg',
  phaseType: 'returnLeg',
  gamePhase: 'RETURN_FLIGHT',
  baseId: 'skyport',
  pathId: returnPath.pathId,
  path: returnPath,
  totalDuration: 0,
  startMode: 'atFirstNode',
  endMode: 'nextPhase',
  loopPreview: false,
  cameraKeyframes: [],
  events: [],
  editableInEditMode: true,
};

export const FLIGHT_PHASE_SEED: FlightPhaseConfig[] = [BASE_ORBIT_PHASE, AERIAL_CRUISE_PHASE, RETURN_LEG_PHASE];

export function flightPhaseForGamePhase(gamePhase: string): FlightPhaseConfig | undefined {
  return FLIGHT_PHASE_SEED.find((p) => p.gamePhase === gamePhase);
}
