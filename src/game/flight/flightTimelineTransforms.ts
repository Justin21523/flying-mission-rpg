import { Euler, Object3D, Vector3 } from 'three';
import { getPath } from '../../stores/editorPathStore';
import { getCurve, samplePos, sampleTangent } from '../path/pathCurve';
import { sampleNodeParams } from './pathNodeParams';
import { sampleUForDirection, type FlightLegDirection } from './flightLeg';
import { applyCraftTimeTrack, type FlightCraftTransform } from './flightTimeTracks';
import type { FlightTimelineTrack, FlightTimelineVec3 } from '../../types/game/flightTimeline';

const RAD2DEG = 180 / Math.PI;
const DEG2RAD = Math.PI / 180;
const samplePosition = new Vector3();
const sampleTangentVec = new Vector3();
const lookTarget = new Vector3();
const sampleObject = new Object3D();
const sampleEuler = new Euler();

function roundVec(v: Vector3): FlightTimelineVec3 {
  return [Math.round(v.x * 100) / 100, Math.round(v.y * 100) / 100, Math.round(v.z * 100) / 100];
}

export interface FlightRouteSampleTransform {
  center: FlightTimelineVec3;
  rotation: FlightTimelineVec3;
}

export function sampleFlightRouteTransform(pathId: string, direction: FlightLegDirection, u: number): FlightRouteSampleTransform {
  const def = getPath(pathId);
  const cc = def ? getCurve(def) : null;
  if (!cc) return { center: [0, 0, 0], rotation: [0, 0, 0] };
  const sampleU = sampleUForDirection(u, direction);
  samplePos(cc.curve, sampleU, samplePosition);
  sampleTangent(cc.curve, sampleU, sampleTangentVec);
  if (direction === 'reverse') sampleTangentVec.multiplyScalar(-1);
  const np = sampleNodeParams(def, sampleU);
  sampleObject.position.copy(samplePosition);
  lookTarget.copy(samplePosition).sub(sampleTangentVec);
  sampleObject.lookAt(lookTarget);
  if (np.bankDeg) sampleObject.rotateZ(np.bankDeg * DEG2RAD);
  sampleEuler.setFromQuaternion(sampleObject.quaternion);
  return {
    center: roundVec(samplePosition),
    rotation: [sampleEuler.x * RAD2DEG, sampleEuler.y * RAD2DEG, sampleEuler.z * RAD2DEG],
  };
}

export function resolveFlightCraftTransform({
  pathId,
  direction,
  u,
  fallbackOffset,
  fallbackScale,
  tracks,
}: {
  pathId: string;
  direction: FlightLegDirection;
  u: number;
  fallbackOffset: FlightTimelineVec3;
  fallbackScale: number;
  tracks?: readonly FlightTimelineTrack[];
}): FlightCraftTransform {
  const sample = sampleFlightRouteTransform(pathId, direction, u);
  const offsetBase: FlightCraftTransform = { position: fallbackOffset, rotation: sample.rotation, scale: fallbackScale };
  const edited = applyCraftTimeTrack(offsetBase, tracks, u);
  return {
    position: [
      sample.center[0] + edited.position[0],
      sample.center[1] + edited.position[1],
      sample.center[2] + edited.position[2],
    ],
    rotation: edited.rotation,
    scale: edited.scale,
  };
}

export function offsetFromWorldPosition(pathId: string, direction: FlightLegDirection, u: number, worldPosition: FlightTimelineVec3): FlightTimelineVec3 {
  const sample = sampleFlightRouteTransform(pathId, direction, u);
  return [
    Math.round((worldPosition[0] - sample.center[0]) * 100) / 100,
    Math.round((worldPosition[1] - sample.center[1]) * 100) / 100,
    Math.round((worldPosition[2] - sample.center[2]) * 100) / 100,
  ];
}

