// Phase A (data model) — curve-based guided paths/tracks. A PathDefinition is a list of PathNodeData turned
// into a Three.js CatmullRomCurve3 (built in Phase B), shared by the player PathFollow, NPC + vehicle
// followers. Additive to the existing traffic RoadPath (waypoint loops) and NPC NpcPath — those keep working.
export type Vec3Tuple = [number, number, number];

// How much control the player keeps while on a path.
export type PathControlMode = 'fullyAutomatic' | 'steeringAssist' | 'forwardLocked' | 'speedAssist';
export const PATH_CONTROL_MODES: PathControlMode[] = ['fullyAutomatic', 'steeringAssist', 'forwardLocked', 'speedAssist'];

export type PathCurveType = 'catmullRom' | 'bezier' | 'linear';
export type PathDirectionMode = 'oneWay' | 'twoWay';

// Per-node action fired when a follower reaches the node.
export type PathNodeAction =
  | { type: 'emitEvent'; event: string }
  | { type: 'wait'; seconds: number }
  | { type: 'setSpeed'; multiplier: number }
  | { type: 'startIncident'; incidentId: string };

export interface PathNodeData {
  id: string;
  position: Vec3Tuple;
  tangentMode: 'automatic' | 'linear' | 'custom';
  tangentIn?: Vec3Tuple;
  tangentOut?: Vec3Tuple;
  speedMultiplier: number;   // local speed scale at this node (default 1)
  width: number;             // lane half-width at this node (steeringAssist / drivable width)
  waitTime?: number;         // seconds a follower pauses on arrival
  tags?: string[];
  actions?: PathNodeAction[];
}

// Branch: when a follower reaches `fromNodeId`, optionally divert onto `toPathId` (by weight / condition flag).
export interface PathBranchRule {
  fromNodeId: string;
  toPathId: string;
  weight?: number;     // for weighted random branching
  requiredFlag?: string; // only branch when this world flag is set
}

export interface PathDefinition {
  id: string;
  name: string;
  areaId?: string;             // optional area scoping
  nodeIds: string[];           // ordered; resolved against a node registry / inline nodes
  nodes?: PathNodeData[];      // inline nodes (editor-authored) — alternative to a shared node registry
  curveType: PathCurveType;
  closed: boolean;             // looped track
  defaultSpeed: number;
  laneWidth: number;
  directionMode: PathDirectionMode;
  entryNodeIds: string[];
  exitNodeIds: string[];
  branchRules?: PathBranchRule[];
  // Optional models tiled along the curve (like a road surface + roadside decor).
  surfaceModelAssetId?: string;
  surfaceSpacing?: number;   // world units between surface tiles (default 6)
  surfaceScale?: number;     // normalised target size for the surface model (default 4)
  decorModelAssetId?: string;
  decorSpacing?: number;     // spacing between decor pieces (default 12)
  decorOffset?: number;      // perpendicular offset to the side (default 4)
}
