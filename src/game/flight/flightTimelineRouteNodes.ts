import { Vector3 } from 'three';
import type { PathDefinition, Vec3Tuple } from '../../types/path';
import { getCurve, nearestU, samplePos } from '../path/pathCurve';
import { sampleUForDirection, type FlightLegDirection } from './flightLeg';

export interface FlightTimelineRouteNodeMarker {
  id: string;
  index: number;
  label: string;
  pathU: number;
  timelineU: number;
  position: Vec3Tuple;
}

export interface FlightTimelineInsertPoint {
  index: number;
  pathU: number;
  position: Vec3Tuple;
}

const scratch = new Vector3();
const point = new Vector3();

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

function timelineUFromPathU(pathU: number, direction: FlightLegDirection): number {
  return direction === 'reverse' ? 1 - clamp01(pathU) : clamp01(pathU);
}

function indexFallbackU(index: number, count: number): number {
  if (count <= 1) return 0;
  return index / (count - 1);
}

export function flightTimelineRouteNodeMarkers(path: PathDefinition | undefined, direction: FlightLegDirection = 'forward'): FlightTimelineRouteNodeMarker[] {
  const nodes = path?.nodes ?? [];
  if (!path || nodes.length === 0) return [];
  const curve = getCurve(path)?.curve;
  return nodes.map((node, index) => {
    const pathU = curve
      ? nearestU(curve, point.set(node.position[0], node.position[1], node.position[2]), scratch, 96)
      : indexFallbackU(index, nodes.length);
    return {
      id: node.id,
      index,
      label: `${index + 1}`,
      pathU,
      timelineU: timelineUFromPathU(pathU, direction),
      position: node.position,
    };
  });
}

export function flightTimelineInsertPoint(path: PathDefinition | undefined, timelineU: number, direction: FlightLegDirection = 'forward'): FlightTimelineInsertPoint | null {
  const nodes = path?.nodes ?? [];
  if (!path || nodes.length === 0) return null;
  const pathU = sampleUForDirection(timelineU, direction);
  const curve = getCurve(path)?.curve;
  const position = curve
    ? samplePos(curve, pathU, scratch)
    : point.set(nodes[nodes.length - 1].position[0], nodes[nodes.length - 1].position[1], nodes[nodes.length - 1].position[2]);
  const index = nodes.length <= 1 ? nodes.length : Math.max(1, Math.min(nodes.length, Math.floor(clamp01(pathU) * (nodes.length - 1)) + 1));
  return {
    index,
    pathU,
    position: [Math.round(position.x * 100) / 100, Math.round(position.y * 100) / 100, Math.round(position.z * 100) / 100],
  };
}
