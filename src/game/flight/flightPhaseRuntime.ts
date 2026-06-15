import {
  CatmullRomCurve3, CubicBezierCurve3, CurvePath, LineCurve3, Object3D, Quaternion, Vector3,
  type Curve,
} from 'three';
import type { Vec3Tuple } from '../../types/path';
import type {
  FlightCameraKeyframe, FlightPathConfig, FlightPhaseConfig, FlightPose, FlightTimelineEvent,
} from '../../types/game/flightPhase';

// Pure evaluation engine for the Flight Phase — the SINGLE source of "what is the state at time t (seconds)".
// Preview, Play and the editor gizmos all call these so they can never diverge. Reuses the kit's arc-length
// curve sampling concept (pathCurve.ts) but on FlightPathConfig nodes, with a seconds timeline derived from
// per-node speed / duration / waitTime. Curves are cached and only rebuilt when a path's signature changes.

const DEG = Math.PI / 180;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpVec = (a: Vec3Tuple, b: Vec3Tuple, t: number): Vec3Tuple => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

// ----- curve cache -------------------------------------------------------------------------------------

interface BuiltCurve {
  curve: Curve<Vector3>;
  length: number;
  nodeU: number[];      // arc-length u∈[0,1] of each node
  nodeCurveY: number[]; // curve-sampled Y at each node (altitude fallback)
}

interface BuiltTiming {
  totalDuration: number;
  arriveT: number[]; // time the craft reaches each node (before its wait)
  departT: number[]; // time the craft leaves each node (after its wait)
}

interface CacheEntry { sig: string; built: BuiltCurve; timing: BuiltTiming; }
const cache = new Map<string, CacheEntry>();

function signature(path: FlightPathConfig): string {
  let s = `${path.curveType}|${path.closedLoop ? 'c' : 'o'}`;
  for (const n of path.nodes) {
    s += `|${n.position.map((v) => v.toFixed(3)).join(',')}`;
    if (n.handleIn) s += `i${n.handleIn.map((v) => v.toFixed(2)).join(',')}`;
    if (n.handleOut) s += `o${n.handleOut.map((v) => v.toFixed(2)).join(',')}`;
    s += `s${n.speed}d${n.duration ?? ''}w${n.waitTime}`;
  }
  return s;
}

function buildCurve(path: FlightPathConfig): BuiltCurve {
  const pts = path.nodes.map((n) => new Vector3(...n.position));
  let curve: Curve<Vector3>;
  if (path.curveType === 'linear') {
    const cp = new CurvePath<Vector3>();
    const seq = path.closedLoop ? [...pts, pts[0]] : pts;
    for (let i = 0; i < seq.length - 1; i++) cp.add(new LineCurve3(seq[i], seq[i + 1]));
    curve = cp;
  } else if (path.curveType === 'bezier') {
    const cp = new CurvePath<Vector3>();
    const count = path.closedLoop ? path.nodes.length : path.nodes.length - 1;
    for (let i = 0; i < count; i++) {
      const a = path.nodes[i];
      const b = path.nodes[(i + 1) % path.nodes.length];
      const pa = new Vector3(...a.position);
      const pb = new Vector3(...b.position);
      const c1 = a.handleOut ? pa.clone().add(new Vector3(...a.handleOut)) : pa.clone().lerp(pb, 1 / 3);
      const c2 = b.handleIn ? pb.clone().add(new Vector3(...b.handleIn)) : pb.clone().lerp(pa, 1 / 3);
      cp.add(new CubicBezierCurve3(pa, c1, c2, pb));
    }
    curve = cp;
  } else {
    curve = new CatmullRomCurve3(pts, path.closedLoop, 'catmullrom');
  }
  const length = curve.getLength();
  // Map each node to its arc-length u by nearest dense sample (the curve passes through the control points).
  const SAMPLES = Math.max(64, path.nodes.length * 16);
  const sampled: Vector3[] = [];
  const scratch = new Vector3();
  for (let i = 0; i <= SAMPLES; i++) sampled.push(curve.getPointAt(i / SAMPLES, new Vector3()).clone());
  const nodeU: number[] = [];
  const nodeCurveY: number[] = [];
  path.nodes.forEach((n, idx) => {
    if (path.closedLoop && idx === 0) { nodeU.push(0); nodeCurveY.push(sampled[0].y); return; }
    scratch.set(...n.position);
    let bestU = 0; let bestD = Infinity;
    for (let i = 0; i <= SAMPLES; i++) { const d = sampled[i].distanceToSquared(scratch); if (d < bestD) { bestD = d; bestU = i / SAMPLES; } }
    nodeU.push(bestU);
    nodeCurveY.push(scratch.y); // node lies on the curve → its own Y
  });
  if (!path.closedLoop) { nodeU[0] = 0; nodeU[nodeU.length - 1] = 1; }
  return { curve, length, nodeU, nodeCurveY };
}

function buildTiming(path: FlightPathConfig, built: BuiltCurve): BuiltTiming {
  const n = path.nodes.length;
  const arriveT = new Array<number>(n).fill(0);
  const departT = new Array<number>(n).fill(0);
  arriveT[0] = 0;
  departT[0] = path.nodes[0].waitTime || 0;
  let t = departT[0];
  const segCount = path.closedLoop ? n : n - 1;
  for (let i = 0; i < segCount; i++) {
    const a = path.nodes[i];
    const b = path.nodes[(i + 1) % n];
    const ua = built.nodeU[i];
    const ub = path.closedLoop && i === segCount - 1 ? 1 : built.nodeU[(i + 1) % n];
    const segLen = Math.max(0.0001, Math.abs(ub - ua) * built.length);
    const speed = Math.max(0.1, b.speed || a.speed || 1);
    const segTime = b.duration && b.duration > 0 ? b.duration : segLen / speed;
    const arriveIdx = (i + 1) % n;
    if (!(path.closedLoop && arriveIdx === 0)) {
      arriveT[arriveIdx] = t + segTime;
      departT[arriveIdx] = arriveT[arriveIdx] + (b.waitTime || 0);
      t = departT[arriveIdx];
    } else {
      t = t + segTime; // closed loop returns to node 0 — end of timeline
    }
  }
  return { totalDuration: t, arriveT, departT };
}

function entry(path: FlightPathConfig): CacheEntry | null {
  if (!path || path.nodes.length < 2) return null;
  const sig = signature(path);
  const hit = cache.get(path.pathId);
  if (hit && hit.sig === sig) return hit;
  const built = buildCurve(path);
  const timing = buildTiming(path, built);
  const fresh: CacheEntry = { sig, built, timing };
  cache.set(path.pathId, fresh);
  return fresh;
}

// ----- public timing -----------------------------------------------------------------------------------

export function getTotalDuration(path: FlightPathConfig): number {
  return entry(path)?.timing.totalDuration ?? 0;
}

export function getPathLength(path: FlightPathConfig): number {
  return entry(path)?.built.length ?? 0;
}

// Pre-sampled arc-length polyline for the path gizmo line (rebuilt only on signature change downstream).
export function samplePathPolyline(path: FlightPathConfig, samples = 64): Vec3Tuple[] {
  const e = entry(path);
  if (!e) return path.nodes.map((n) => n.position);
  const out: Vec3Tuple[] = [];
  const v = new Vector3();
  for (let i = 0; i <= samples; i++) { e.built.curve.getPointAt(i / samples, v); out.push([v.x, v.y, v.z]); }
  return out;
}

// Per-node arrival times (seconds) — used to scrub the timeline to a node when it's selected/focused.
export function getNodeTimes(path: FlightPathConfig): number[] {
  return entry(path)?.timing.arriveT.slice() ?? path.nodes.map(() => 0);
}

// Map a time (seconds) to arc-length u∈[0,1] + the segment it falls in. Monotonic non-decreasing in t.
export function timeToU(path: FlightPathConfig, time: number): { u: number; segmentIndex: number } {
  const e = entry(path);
  if (!e) return { u: 0, segmentIndex: 0 };
  const { arriveT, departT } = e.timing;
  const n = path.nodes.length;
  const t = Math.max(0, Math.min(time, e.timing.totalDuration));
  const segCount = path.closedLoop ? n : n - 1;
  for (let i = 0; i < segCount; i++) {
    const arriveIdx = (i + 1) % n;
    const segStart = departT[i];
    const segEnd = path.closedLoop && arriveIdx === 0 ? e.timing.totalDuration : arriveT[arriveIdx];
    // waiting AT node i
    if (t <= departT[i] && t >= arriveT[i]) return { u: e.built.nodeU[i], segmentIndex: i };
    if (t >= segStart && t <= segEnd) {
      const ua = e.built.nodeU[i];
      const ub = path.closedLoop && arriveIdx === 0 ? 1 : e.built.nodeU[arriveIdx];
      const f = segEnd > segStart ? (t - segStart) / (segEnd - segStart) : 0;
      return { u: clamp01(lerp(ua, ub, f)), segmentIndex: i };
    }
  }
  return { u: path.closedLoop ? 0 : 1, segmentIndex: Math.max(0, segCount - 1) };
}

// ----- flight state ------------------------------------------------------------------------------------

const _o = new Object3D();
const _pos = new Vector3();
const _tan = new Vector3();
const _look = new Vector3();

export interface FlightRuntimeState {
  u: number;
  position: Vec3Tuple;
  quaternion: [number, number, number, number]; // x,y,z,w
  bank: number;        // degrees
  altitude: number;
  pose: FlightPose;
  segmentIndex: number;
  speed: number;       // world units/sec around this point
}

const poseEuler: Record<FlightPose, Vec3Tuple> = {
  level: [0, 0, 0],
  climb: [12, 0, 0],
  dive: [-12, 0, 0],
  bankLeft: [0, 0, 18],
  bankRight: [0, 0, -18],
  turn: [0, 0, 10],
};

export function evaluateFlightState(path: FlightPathConfig, time: number): FlightRuntimeState {
  const e = entry(path);
  if (!e) {
    const p = path.nodes[0]?.position ?? [0, 0, 0];
    return { u: 0, position: p, quaternion: [0, 0, 0, 1], bank: 0, altitude: p[1], pose: 'level', segmentIndex: 0, speed: 0 };
  }
  const { u, segmentIndex } = timeToU(path, time);
  const curve = e.built.curve;
  curve.getPointAt(clamp01(u), _pos);
  curve.getTangentAt(clamp01(u), _tan);

  const n = path.nodes.length;
  const a = path.nodes[segmentIndex];
  const b = path.nodes[(segmentIndex + 1) % n];
  const ua = e.built.nodeU[segmentIndex];
  const ub = path.closedLoop && (segmentIndex + 1) % n === 0 ? 1 : e.built.nodeU[(segmentIndex + 1) % n];
  const f = ub > ua ? clamp01((u - ua) / (ub - ua)) : 0;

  // altitude override (blend a→b when set)
  let altitude = _pos.y;
  if (a.altitude !== undefined || b.altitude !== undefined) {
    altitude = lerp(a.altitude ?? e.built.nodeCurveY[segmentIndex], b.altitude ?? e.built.nodeCurveY[(segmentIndex + 1) % n], f);
    _pos.y = altitude;
  }

  // orientation: lookAt(pos − tangent) → −Z forward (kit convention), then pose + bank + rotation bias.
  _look.copy(_pos).sub(_tan);
  _o.position.copy(_pos);
  _o.up.set(0, 1, 0);
  _o.lookAt(_look);
  const bank = lerp(a.bankingAngle || 0, b.bankingAngle || 0, f);
  const pe = poseEuler[f < 0.5 ? a.flightPose : b.flightPose] ?? poseEuler.level;
  _o.rotateX(pe[0] * DEG);
  _o.rotateY(pe[1] * DEG);
  _o.rotateZ((pe[2] + bank) * DEG);
  // explicit per-node rotation override bias (interpolated)
  const rot = lerpVec(a.rotation, b.rotation, f);
  if (rot[0] || rot[1] || rot[2]) { _o.rotateX(rot[0] * DEG); _o.rotateY(rot[1] * DEG); _o.rotateZ(rot[2] * DEG); }
  const q = new Quaternion().copy(_o.quaternion);

  return {
    u,
    position: [_pos.x, _pos.y, _pos.z],
    quaternion: [q.x, q.y, q.z, q.w],
    bank,
    altitude,
    pose: f < 0.5 ? a.flightPose : b.flightPose,
    segmentIndex,
    speed: Math.max(0.1, b.speed || a.speed || 1),
  };
}

// Interpolated steering-corridor radius (world units) at a time.
function influenceRadiusAt(path: FlightPathConfig, segmentIndex: number, u: number): number {
  const e = entry(path);
  if (!e) return 8;
  const n = path.nodes.length;
  const a = path.nodes[segmentIndex];
  const b = path.nodes[(segmentIndex + 1) % n];
  const ua = e.built.nodeU[segmentIndex];
  const ub = path.closedLoop && (segmentIndex + 1) % n === 0 ? 1 : e.built.nodeU[(segmentIndex + 1) % n];
  const f = ub > ua ? clamp01((u - ua) / (ub - ua)) : 0;
  return Math.max(0, lerp(a.influenceRadius ?? 8, b.influenceRadius ?? 8, f));
}

// Guided-flight steering offset (world units) for normalized inputs lateralN / verticalN ∈ [-1,1]. Lateral is
// along the horizontal perpendicular to the path tangent, vertical is world-up; the combined offset is clamped
// to the node's influenceRadius corridor so steering never leaves the authored route's allowance.
export function flightSteerOffset(path: FlightPathConfig, time: number, lateralN: number, verticalN: number): Vec3Tuple {
  const e = entry(path);
  if (!e) return [0, 0, 0];
  const { u, segmentIndex } = timeToU(path, time);
  e.built.curve.getTangentAt(clamp01(u), _tan);
  const rx = _tan.z; const rz = -_tan.x;
  const rl = Math.hypot(rx, rz) || 1;
  const R = influenceRadiusAt(path, segmentIndex, u);
  let lat = lateralN * R;
  let vert = verticalN * R;
  const mag = Math.hypot(lat, vert);
  if (mag > R && mag > 0) { const s = R / mag; lat *= s; vert *= s; }
  return [(rx / rl) * lat, vert, (rz / rl) * lat];
}

// ----- camera ------------------------------------------------------------------------------------------

const easings = {
  linear: (t: number) => t,
  easeIn: (t: number) => t * t,
  easeOut: (t: number) => 1 - (1 - t) * (1 - t),
  easeInOut: (t: number) => t * t * (3 - 2 * t),
  hold: () => 0,
};

export interface ResolvedFlightCamera {
  position: Vec3Tuple;
  lookAt?: Vec3Tuple;
  rotation: Vec3Tuple;
  fov: number;
  followTargetId?: string;
}

export function resolveCameraAtTime(keyframes: readonly FlightCameraKeyframe[], time: number): ResolvedFlightCamera | null {
  if (!keyframes.length) return null;
  const ks = [...keyframes].sort((x, y) => x.time - y.time);
  if (time <= ks[0].time) return toCam(ks[0]);
  const last = ks[ks.length - 1];
  if (time >= last.time) return toCam(last);
  let i = 0;
  while (i < ks.length - 1 && ks[i + 1].time <= time) i++;
  const a = ks[i];
  const b = ks[i + 1];
  const span = b.time - a.time;
  const raw = span > 0 ? (time - a.time) / span : 0;
  const t = (easings[b.transitionType] ?? easings.linear)(raw);
  const followTargetId = t < 0.5 ? a.followTargetId : b.followTargetId;
  return {
    position: lerpVec(a.position, b.position, t),
    rotation: lerpVec(a.rotation, b.rotation, t),
    lookAt: a.lookAtTarget && b.lookAtTarget ? lerpVec(a.lookAtTarget, b.lookAtTarget, t) : (t < 0.5 ? a.lookAtTarget : b.lookAtTarget),
    fov: lerp(a.fov, b.fov, t),
    followTargetId,
  };
}

function toCam(k: FlightCameraKeyframe): ResolvedFlightCamera {
  return { position: k.position, rotation: k.rotation, lookAt: k.lookAtTarget, fov: k.fov, followTargetId: k.followTargetId };
}

// ----- events ------------------------------------------------------------------------------------------

// Events whose time was crossed in (prevTime, time] — for firing (play + preview). Forward only.
export function resolveEventsAtTime(events: readonly FlightTimelineEvent[], time: number, prevTime: number, preview = false): FlightTimelineEvent[] {
  const lo = Math.min(prevTime, time);
  const hi = Math.max(prevTime, time);
  return events.filter((e) => e.enabled && (!preview || e.previewEnabled) && e.time > lo && e.time <= hi);
}

// Events near a time (within window seconds) — for scrub markers / "active" highlight.
export function activeEventsAtTime(events: readonly FlightTimelineEvent[], time: number, window = 0.2): FlightTimelineEvent[] {
  return events.filter((e) => e.enabled && Math.abs(e.time - time) <= window);
}

// ----- path derived + editing helpers ------------------------------------------------------------------

export function recalcPathDerived<T extends FlightPathConfig>(path: T): T {
  const e = entry(path);
  return { ...path, totalDistance: e?.built.length ?? 0, totalDuration: e?.timing.totalDuration ?? 0 };
}

// Auto-smooth: drop bezier handles so the curve falls back to auto catmull tangents.
export function smoothPath<T extends FlightPathConfig>(path: T): T {
  return recalcPathDerived({ ...path, nodes: path.nodes.map((n) => ({ ...n, handleIn: undefined, handleOut: undefined })) });
}

export function syncPhaseDerived(phase: FlightPhaseConfig): FlightPhaseConfig {
  const path = recalcPathDerived(phase.path);
  return { ...phase, path, totalDuration: path.totalDuration };
}
