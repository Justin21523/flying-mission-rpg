import type { SourceConfidence } from './character';

export type TrafficPhase = 'green' | 'yellow' | 'red';

export interface RoadPath {
  id: string;
  areaId: string;
  waypoints: [number, number, number][];
  totalLength: number;
  segmentLengths: number[]; // one per segment; last segment closes loop back to waypoints[0]
}

export interface TrafficSignalDef {
  id: string;
  areaId: string;
  position: [number, number, number];
  pathId: string;
  progressOnPath: number;   // 0–1: vehicles stop when this close ahead
  initialPhase: TrafficPhase;
  initialTimer: number;     // seconds already elapsed in the initial phase
  greenSeconds: number;
  yellowSeconds: number;
  redSeconds: number;
  modelAssetId?: string; // GLB model rendered instead of the pole/housing when set
  modelScale?: number;   // normalise target for the model, default ~4
}

export type CrosswalkAxis = 'x' | 'z';

// A pedestrian crossing: zebra stripes + a walker that crosses when the linked signal is RED (cars stopped)
// and waits at the curb otherwise. No linked signal → always crossing. Editable in the 🚦 Traffic tab.
export interface Crosswalk {
  id: string;
  areaId: string;
  position: [number, number, number]; // centre of the crossing
  length: number;                     // span across the road (world units)
  axis: CrosswalkAxis;                // direction the pedestrian walks
  linkedSignalId?: string;            // pedestrian crosses while this signal is red
  pedModelAssetId?: string;           // GLB for the walker (else a capsule)
  pedSpeed?: number;                  // walk speed (default 1.2)
}

export type VehicleKind = 'car' | 'truck' | 'bus' | 'emergency' | 'drone';

export interface VehicleDefinition {
  id: string;
  name: string;          // English display name (shown in game)
  nameZhTW?: string;     // optional zh-TW reference, not displayed
  areaId: string;
  pathId: string;
  speed: number;            // world-units per second
  initialProgress: number;  // 0–1 starting offset
  color: string;
  bodySize: [number, number, number]; // [width, height, length] (used when no model)
  modelAssetId?: string;    // GLB model — rendered instead of the box when set (size-normalised)
  modelScale?: number;      // normalise target (largest dim) for the model, default ~2.4
  kind?: VehicleKind;       // car/truck/bus/emergency/drone (flavour + future behaviour)
  yields?: boolean;         // slows for the player during emergencies (default true)
  sourceConfidence: SourceConfidence;
}

// ---- Path helpers ----------------------------------------------------------
// Build a RoadPath from a list of waypoints.
// The path is treated as a closed loop: last waypoint connects back to waypoints[0].
export function computeRoadPath(
  id: string,
  areaId: string,
  waypoints: [number, number, number][],
): RoadPath {
  const segmentLengths: number[] = [];
  let totalLength = 0;
  for (let i = 0; i < waypoints.length; i++) {
    const a = waypoints[i];
    const b = waypoints[(i + 1) % waypoints.length];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const dz = b[2] - a[2];
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    segmentLengths.push(len);
    totalLength += len;
  }
  return { id, areaId, waypoints, totalLength, segmentLengths };
}

// Interpolate world position along the path at 0–1 progress.
export function getPathPosition(
  path: RoadPath,
  progress: number,
): [number, number, number] {
  if (path.totalLength === 0) return path.waypoints[0];
  let dist = ((progress % 1) + 1) % 1 * path.totalLength;
  for (let i = 0; i < path.segmentLengths.length; i++) {
    const segLen = path.segmentLengths[i];
    if (dist <= segLen || i === path.segmentLengths.length - 1) {
      const t = segLen > 0 ? Math.min(1, dist / segLen) : 0;
      const a = path.waypoints[i];
      const b = path.waypoints[(i + 1) % path.waypoints.length];
      return [
        a[0] + t * (b[0] - a[0]),
        a[1] + t * (b[1] - a[1]),
        a[2] + t * (b[2] - a[2]),
      ];
    }
    dist -= segLen;
  }
  return path.waypoints[0];
}

// Y-axis heading (radians) for the segment at 0–1 progress.
export function getPathHeading(path: RoadPath, progress: number): number {
  if (path.totalLength === 0) return 0;
  let dist = ((progress % 1) + 1) % 1 * path.totalLength;
  for (let i = 0; i < path.segmentLengths.length; i++) {
    if (dist <= path.segmentLengths[i] || i === path.segmentLengths.length - 1) {
      const a = path.waypoints[i];
      const b = path.waypoints[(i + 1) % path.waypoints.length];
      return Math.atan2(b[0] - a[0], b[2] - a[2]);
    }
    dist -= path.segmentLengths[i];
  }
  return 0;
}
