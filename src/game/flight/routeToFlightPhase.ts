import type { PathDefinition } from '../../types/path';
import type { FlightCurveType, FlightPathConfig, FlightPathNode } from '../../types/game/flightPhase';

// Convert a POLI PathDefinition (editorPathStore / world routes) into a FlightPathConfig so the unified Flight
// Editor + guided runtime can drive ANY existing route (aerial cruise, return, etc.) with the same tools as the
// base orbit. Derived totals are filled by flightPhaseRuntime.recalcPathDerived downstream.
const toCurve = (c: PathDefinition['curveType']): FlightCurveType => (c === 'bezier' ? 'bezier' : c === 'linear' ? 'linear' : 'catmullRom');

export function routeToFlightPath(def: PathDefinition, pathId: string, name: string, reverse = false): FlightPathConfig {
  const src = def.nodes ?? [];
  const ordered = reverse ? [...src].reverse() : src;
  const nodes: FlightPathNode[] = ordered.map((n, i) => ({
    nodeId: `${pathId}_n${i}`,
    nodeName: i === 0 ? 'Start' : i === ordered.length - 1 ? 'Arrive' : `Waypoint_${i}`,
    position: [...n.position] as [number, number, number],
    rotation: [0, 0, 0],
    speed: Math.max(1, def.defaultSpeed * (n.speedMultiplier ?? 1)),
    waitTime: n.waitTime ?? 0,
    bankingAngle: n.bankDeg ?? 0,
    influenceRadius: Math.max(2, n.width ?? 8),
    flightPose: 'level',
    eventIds: [],
  }));
  return {
    pathId,
    pathName: name,
    curveType: toCurve(def.curveType),
    nodes,
    closedLoop: false,
    previewResolution: 64,
    totalDistance: 0,
    totalDuration: 0,
  };
}
