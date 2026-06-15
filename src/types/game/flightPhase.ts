import type { Vec3Tuple } from '../path';

// Flight Phase data model — the single source of truth for the base-exterior fly-around / orbit phase.
// Authored in Edit Mode, evaluated in seconds by flightPhaseRuntime, and shared by Edit / Preview / Play
// (the path nodes, camera keyframes AND timeline events all drive the live scene). Supersedes the older
// u∈[0,1] flight cue / flight timeline track model for this phase. Persisted by flightPhaseStore.

export type FlightCurveType = 'catmullRom' | 'bezier' | 'linear';

// Authoring intent for how the craft is held through a node — biases the evaluated orientation.
export type FlightPose = 'level' | 'climb' | 'dive' | 'bankLeft' | 'bankRight' | 'turn';
export const FLIGHT_POSES: FlightPose[] = ['level', 'climb', 'dive', 'bankLeft', 'bankRight', 'turn'];

// How a node's arrival time is reached when scrubbing/playing between camera keyframes.
export type FlightTransition = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'hold';
export const FLIGHT_TRANSITIONS: FlightTransition[] = ['linear', 'easeIn', 'easeOut', 'easeInOut', 'hold'];

// The kinds of timeline events a phase can fire (preview + play). `payload` is event-specific free data.
export type FlightEventType =
  | 'cameraSwitch'
  | 'animation'
  | 'speedChange'
  | 'turn'
  | 'boostFx'
  | 'dialogue'
  | 'missionBriefing'
  | 'airWarning'
  | 'basePanorama'
  | 'trailFx'
  | 'nextPhase';
export const FLIGHT_EVENT_TYPES: FlightEventType[] = [
  'cameraSwitch', 'animation', 'speedChange', 'turn', 'boostFx', 'dialogue',
  'missionBriefing', 'airWarning', 'basePanorama', 'trailFx', 'nextPhase',
];

export interface FlightPathNode {
  nodeId: string;
  nodeName: string;
  position: Vec3Tuple;
  rotation: Vec3Tuple;        // degrees — authoring orientation override bias (0,0,0 = follow curve)
  speed: number;              // world units/sec the craft holds approaching this node (drives seconds timing)
  duration?: number;          // optional explicit seconds for the segment INTO this node (overrides speed-based)
  waitTime: number;           // seconds the craft holds AT this node before continuing
  bankingAngle: number;       // degrees of extra roll bias near this node
  altitude?: number;          // optional Y override (world units) — overrides the curve's sampled height
  influenceRadius?: number;   // steering-corridor half-width near this node (world units; default ~8)
  flightPose: FlightPose;
  handleIn?: Vec3Tuple;       // bezier/custom incoming control offset (relative to position)
  handleOut?: Vec3Tuple;      // bezier/custom outgoing control offset (relative to position)
  eventIds: string[];         // events fired when the craft passes this node
  cameraTargetId?: string;    // camera keyframe to favour while near this node
}

export interface FlightPathConfig {
  pathId: string;
  pathName: string;
  curveType: FlightCurveType;
  nodes: FlightPathNode[];
  closedLoop: boolean;
  previewResolution: number;  // polyline samples for the path gizmo line
  totalDistance: number;      // derived — arc length (world units)
  totalDuration: number;      // derived — seconds end-to-end (incl. waits)
}

export interface FlightCameraKeyframe {
  keyframeId: string;
  time: number;               // seconds along the phase timeline
  position: Vec3Tuple;        // world-space camera position
  rotation: Vec3Tuple;        // degrees (used when lookAtTarget is absent)
  lookAtTarget?: Vec3Tuple;   // world-space point to look at (wins over rotation)
  fov: number;
  transitionType: FlightTransition;
  followTargetId?: string;    // 'craft' makes the shot ride the craft; else a fixed world shot
}

export interface FlightTimelineEvent {
  eventId: string;
  time: number;               // seconds along the phase timeline
  eventType: FlightEventType;
  payload: Record<string, unknown>;
  previewEnabled: boolean;    // show/fire in Edit Mode preview
  triggerOnce: boolean;       // fire once per playthrough (vs every crossing)
  enabled: boolean;
}

export type FlightStartMode = 'fromBaseInterior' | 'fromBaseGate' | 'atFirstNode';
export type FlightEndMode = 'holdAtLastNode' | 'loop' | 'nextPhase';

// Which broad kind of flight leg this is (drives default tuning + which scene hosts it).
export type FlightPhaseType = 'baseOrbit' | 'aerialCruise' | 'returnLeg' | 'missionApproach' | 'baseApproach';

// The game FSM phase this Flight Phase is bound to — the scene reads its config by matching this.
export type FlightGamePhase = 'BASE_FLY_AROUND' | 'WORLD_FLIGHT' | 'RETURN_FLIGHT' | 'DESTINATION_APPROACH' | 'BASE_APPROACH';

export interface FlightPhaseConfig {
  phaseId: string;
  phaseName: string;
  phaseType: FlightPhaseType;
  gamePhase: FlightGamePhase; // FSM phase binding — the scene picks the matching config
  baseId: string;
  pathId: string;             // matches its FlightPathConfig.pathId
  path: FlightPathConfig;     // inline (single source of truth — no separate registry lookup)
  totalDuration: number;      // derived — mirrors path.totalDuration (seconds)
  startMode: FlightStartMode;
  endMode: FlightEndMode;
  loopPreview: boolean;
  cameraKeyframes: FlightCameraKeyframe[];
  events: FlightTimelineEvent[];
  flightVehicleId?: string;
  characterId?: string;
  editableInEditMode: boolean;
}
