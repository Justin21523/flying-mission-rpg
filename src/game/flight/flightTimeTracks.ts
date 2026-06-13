import type {
  FlightTimelineKeyframe,
  FlightTimelineTarget,
  FlightTimelineTrack,
  FlightTimelineVec3,
} from '../../types/game/flightTimeline';

export const FLIGHT_KEYFRAME_STEP_U = 0.001;
const EPS = 0.00001;

export interface FlightCraftTransform {
  position: FlightTimelineVec3;
  rotation: FlightTimelineVec3;
  scale: number;
}

export interface FlightCameraConfig {
  distance: number;
  height: number;
  angleDeg: number;
}

export interface EvaluatedFlightTrack {
  position?: FlightTimelineVec3;
  rotation?: FlightTimelineVec3;
  scale?: number;
  distance?: number;
  height?: number;
  angleDeg?: number;
}

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

function roundU(u: number): number {
  return Math.round(clamp01(u) / FLIGHT_KEYFRAME_STEP_U) * FLIGHT_KEYFRAME_STEP_U;
}

function sameTarget(a: FlightTimelineTarget, b: FlightTimelineTarget): boolean {
  return a.kind === b.kind;
}

export function flightTimeTrackId(target: FlightTimelineTarget): string {
  return target.kind;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpVec(a: FlightTimelineVec3, b: FlightTimelineVec3, t: number): FlightTimelineVec3 {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

function valueAt(
  prev: FlightTimelineKeyframe,
  next: FlightTimelineKeyframe | undefined,
  u: number,
  interpolation: FlightTimelineTrack['interpolation'],
): EvaluatedFlightTrack {
  if (!next || interpolation === 'hold' || next.u <= prev.u + EPS) {
    return {
      position: prev.position,
      rotation: prev.rotation,
      scale: prev.scale,
      distance: prev.distance,
      height: prev.height,
      angleDeg: prev.angleDeg,
    };
  }
  const k = clamp01((u - prev.u) / (next.u - prev.u));
  return {
    position: prev.position && next.position ? lerpVec(prev.position, next.position, k) : prev.position ?? next.position,
    rotation: prev.rotation && next.rotation ? lerpVec(prev.rotation, next.rotation, k) : prev.rotation ?? next.rotation,
    scale: prev.scale !== undefined && next.scale !== undefined ? lerp(prev.scale, next.scale, k) : prev.scale ?? next.scale,
    distance: prev.distance !== undefined && next.distance !== undefined ? lerp(prev.distance, next.distance, k) : prev.distance ?? next.distance,
    height: prev.height !== undefined && next.height !== undefined ? lerp(prev.height, next.height, k) : prev.height ?? next.height,
    angleDeg: prev.angleDeg !== undefined && next.angleDeg !== undefined ? lerp(prev.angleDeg, next.angleDeg, k) : prev.angleDeg ?? next.angleDeg,
  };
}

export function findFlightTimeTrack(tracks: readonly FlightTimelineTrack[] | undefined, target: FlightTimelineTarget): FlightTimelineTrack | undefined {
  return (tracks ?? []).find((track) => sameTarget(track.target, target));
}

export function evaluateFlightTimeTrack(track: FlightTimelineTrack | undefined, u: number): EvaluatedFlightTrack | undefined {
  const keyframes = (track?.keyframes ?? []).slice().sort((a, b) => a.u - b.u);
  if (!track || keyframes.length === 0) return undefined;
  const t = roundU(u);
  let prev = keyframes[0];
  if (!prev) return undefined;
  if (t <= prev.u + EPS) return valueAt(prev, undefined, t, track.interpolation);
  for (let i = 1; i < keyframes.length; i += 1) {
    const next = keyframes[i];
    if (!next) continue;
    if (t <= next.u + EPS) return valueAt(prev, next, t, track.interpolation);
    prev = next;
  }
  return valueAt(prev, undefined, t, track.interpolation);
}

function targetValue(tracks: readonly FlightTimelineTrack[] | undefined, target: FlightTimelineTarget, u: number): EvaluatedFlightTrack | undefined {
  return evaluateFlightTimeTrack(findFlightTimeTrack(tracks, target), u);
}

export function applyCraftTimeTrack(
  base: FlightCraftTransform,
  tracks: readonly FlightTimelineTrack[] | undefined,
  u: number,
): FlightCraftTransform {
  const track = targetValue(tracks, { kind: 'craft' }, u);
  if (!track) return base;
  return {
    position: track.position ?? base.position,
    rotation: track.rotation ?? base.rotation,
    scale: track.scale ?? base.scale,
  };
}

export function applyCameraTimeTrack(
  base: FlightCameraConfig,
  tracks: readonly FlightTimelineTrack[] | undefined,
  u: number,
): FlightCameraConfig {
  const track = targetValue(tracks, { kind: 'camera' }, u);
  if (!track) return base;
  return {
    distance: track.distance ?? base.distance,
    height: track.height ?? base.height,
    angleDeg: track.angleDeg ?? base.angleDeg,
  };
}

export function upsertFlightTimeKeyframe(
  tracks: readonly FlightTimelineTrack[] | undefined,
  target: FlightTimelineTarget,
  u: number,
  keyframe: Omit<FlightTimelineKeyframe, 'u'>,
): FlightTimelineTrack[] {
  const nextTracks = [...(tracks ?? [])];
  const idx = nextTracks.findIndex((track) => sameTarget(track.target, target));
  const incoming: FlightTimelineKeyframe = { ...keyframe, u: roundU(u) };
  if (idx < 0) {
    return [
      ...nextTracks,
      { id: flightTimeTrackId(target), target, interpolation: 'linear', keyframes: [incoming] },
    ];
  }
  const track = nextTracks[idx];
  if (!track) return nextTracks;
  const frames = [...track.keyframes];
  const frameIdx = frames.findIndex((frame) => Math.abs(frame.u - incoming.u) <= EPS);
  if (frameIdx >= 0) {
    const old = frames[frameIdx];
    if (old) frames[frameIdx] = { ...old, ...incoming };
  } else {
    frames.push(incoming);
  }
  nextTracks[idx] = { ...track, keyframes: frames.sort((a, b) => a.u - b.u) };
  return nextTracks;
}

export function removeFlightTimeKeyframeAt(
  tracks: readonly FlightTimelineTrack[] | undefined,
  target: FlightTimelineTarget,
  u: number,
): FlightTimelineTrack[] {
  const t = roundU(u);
  return (tracks ?? [])
    .map((track) => sameTarget(track.target, target) ? { ...track, keyframes: track.keyframes.filter((frame) => Math.abs(frame.u - t) > EPS) } : track)
    .filter((track) => track.keyframes.length > 0);
}

export function removeFlightTimeTrack(
  tracks: readonly FlightTimelineTrack[] | undefined,
  target: FlightTimelineTarget,
): FlightTimelineTrack[] {
  return (tracks ?? []).filter((track) => !sameTarget(track.target, target));
}

export function keyframeTransformForFlightTarget(
  tracks: readonly FlightTimelineTrack[] | undefined,
  target: FlightTimelineTarget,
  u: number,
): EvaluatedFlightTrack | undefined {
  return targetValue(tracks, target, u);
}

