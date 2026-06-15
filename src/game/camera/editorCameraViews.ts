import type { FlightPhaseConfig } from '../../types/game/flightPhase';
import type { FlightViewMode } from '../../stores/game/flightTimelineStore';
import type { Vec3Tuple } from '../../types/path';

// Pure helpers for the Flight Phase editor view presets (Overview / Top / Side / Front). Compute a bounding
// box over the path nodes + camera keyframes, then a camera offset direction per view. Applied by
// FlightEditorViewController. 'follow' rides the craft and 'free' leaves the user's orbit alone (handled there).

export interface PathBounds { center: Vec3Tuple; radius: number; }

export function computePathBounds(phase: FlightPhaseConfig): PathBounds {
  const pts: Vec3Tuple[] = [...phase.path.nodes.map((n) => n.position), ...phase.cameraKeyframes.map((k) => k.position)];
  if (pts.length === 0) return { center: [0, 30, 0], radius: 40 };
  const min: Vec3Tuple = [Infinity, Infinity, Infinity];
  const max: Vec3Tuple = [-Infinity, -Infinity, -Infinity];
  for (const p of pts) for (let i = 0; i < 3; i++) { if (p[i] < min[i]) min[i] = p[i]; if (p[i] > max[i]) max[i] = p[i]; }
  const center: Vec3Tuple = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2];
  const radius = Math.max(8, 0.5 * Math.hypot(max[0] - min[0], max[1] - min[1], max[2] - min[2]));
  return { center, radius };
}

// Unit direction FROM the target TO the camera for a view mode (null = no preset offset → leave as-is).
export function viewDirection(mode: FlightViewMode): Vec3Tuple | null {
  switch (mode) {
    case 'overview': return norm([0.6, 0.65, 1]);
    case 'top': return [0, 1, 0.0001];
    case 'side': return [1, 0.08, 0.0001];
    case 'front': return [0.0001, 0.08, 1];
    default: return null; // follow / free
  }
}

// Distance to frame a sphere of `radius` at ~50° fov, with margin.
export function frameDistance(radius: number): number {
  return Math.max(14, radius * 2.4);
}

function norm(v: Vec3Tuple): Vec3Tuple {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}
