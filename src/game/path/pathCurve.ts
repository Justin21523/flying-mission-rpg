import { CatmullRomCurve3, Vector3 } from 'three';
import type { PathDefinition, PathNodeData, Vec3Tuple } from '../../types/path';

// Phase B — build & cache a Three.js CatmullRomCurve3 from a PathDefinition, plus alloc-free sampling helpers
// for the player PathFollow (and later NPC/vehicle followers). The curve is rebuilt ONLY when a path's node
// signature changes; sampling writes into caller-supplied scratch Vector3s, so there is zero per-frame
// allocation in useFrame. Additive to the existing traffic RoadPath (waypoint lerp); does not touch it.

interface CachedCurve {
  curve: CatmullRomCurve3;
  sig: string;
  length: number;
  debug: Vec3Tuple[]; // pre-sampled polyline for the debug <Line>
}

const cache = new Map<string, CachedCurve>();

// Resolve a path's ordered nodes — inline `nodes` (editor-authored) win; otherwise nothing (shared node
// registries are a later concern). Returns an empty array when a path has no usable nodes.
function resolveNodes(def: PathDefinition): PathNodeData[] {
  if (def.nodes && def.nodes.length > 0) return def.nodes;
  return [];
}

// A cheap signature of everything that affects the curve shape — node count + each node position + closed flag.
// Changing a node (drag in Edit Mode) flips this string, so the cached curve is rebuilt; otherwise it is reused.
function signature(def: PathDefinition, nodes: PathNodeData[]): string {
  let s = def.closed ? 'c' : 'o';
  for (const n of nodes) s += `|${n.position[0].toFixed(3)},${n.position[1].toFixed(3)},${n.position[2].toFixed(3)}`;
  return s;
}

const DEBUG_SAMPLES = 48; // polyline resolution for the debug line

function build(def: PathDefinition, nodes: PathNodeData[], sig: string): CachedCurve {
  const points = nodes.map((n) => new Vector3(n.position[0], n.position[1], n.position[2]));
  const curve = new CatmullRomCurve3(points, def.closed, 'catmullrom');
  const length = curve.getLength();
  // Pre-sample the debug polyline once (reused until the signature changes).
  const debug: Vec3Tuple[] = [];
  const tmp = new Vector3();
  for (let i = 0; i <= DEBUG_SAMPLES; i++) {
    curve.getPointAt(i / DEBUG_SAMPLES, tmp);
    debug.push([tmp.x, tmp.y, tmp.z]);
  }
  return { curve, sig, length, debug };
}

// Returns the cached curve for a path (building/rebuilding only on a node-signature change). Returns null when
// the path has fewer than 2 nodes (a curve needs at least two points).
export function getCurve(def: PathDefinition): CachedCurve | null {
  const nodes = resolveNodes(def);
  if (nodes.length < 2) { cache.delete(def.id); return null; }
  const sig = signature(def, nodes);
  const hit = cache.get(def.id);
  if (hit && hit.sig === sig) return hit;
  const fresh = build(def, nodes, sig);
  cache.set(def.id, fresh);
  return fresh;
}

// Arc-length-parameterised position at u∈[0,1], written into `out` (no allocation).
export function samplePos(curve: CatmullRomCurve3, u: number, out: Vector3): Vector3 {
  return curve.getPointAt(clamp01(u), out);
}

// Arc-length-parameterised unit tangent at u∈[0,1], written into `out` (no allocation).
export function sampleTangent(curve: CatmullRomCurve3, u: number, out: Vector3): Vector3 {
  return curve.getTangentAt(clamp01(u), out);
}

// Coarse nearest-arc-length search: returns the u whose sampled point is closest to `point`. Used for entry
// (drop the follower onto the path at the nearest spot) and steeringAssist projection. `scratch` is reused.
export function nearestU(curve: CatmullRomCurve3, point: Vector3, scratch: Vector3, samples = 32): number {
  let bestU = 0;
  let bestD = Infinity;
  for (let i = 0; i <= samples; i++) {
    const u = i / samples;
    curve.getPointAt(u, scratch);
    const d = scratch.distanceToSquared(point);
    if (d < bestD) { bestD = d; bestU = u; }
  }
  return bestU;
}

// Cached pre-sampled polyline for the debug <Line>. Empty when the path is not curvable yet.
export function debugPoints(def: PathDefinition): Vec3Tuple[] {
  return getCurve(def)?.debug ?? [];
}

function clamp01(u: number): number { return u < 0 ? 0 : u > 1 ? 1 : u; }
