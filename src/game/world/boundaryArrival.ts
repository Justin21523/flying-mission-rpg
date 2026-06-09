import { getWorldArea } from '../../stores/editorWorldStore';
import { getEffectiveAreaSize } from './areaExtent';
import type { EdgeDir } from '../../types/world';

// POLI — shared arrival helper. When a portal / teleport / cross-area travel has NO explicit destination
// point, drop the player in the OPEN near a boundary edge of the target area (never at the centre, where
// set-pieces can block or hide them). Used by PortalLayer + MapPointLayer so every "no-target" arrival
// behaves the same: appear at the open map edge.

// How far INSIDE the arrival edge to land — well clear of the edge so you don't immediately re-cross it.
const BOUNDARY_MARGIN = 16;

type Vec3 = { x: number; y: number; z: number };

// Open spot just inside one boundary edge of an area. north=-z, south=+z, east=+x, west=-x.
export function spawnNearBoundary(areaId: string, edge: EdgeDir): Vec3 {
  const d = Math.max(2, getEffectiveAreaSize(areaId) - BOUNDARY_MARGIN);
  switch (edge) {
    case 'east': return { x: d, y: 3, z: 0 };
    case 'west': return { x: -d, y: 3, z: 0 };
    case 'south': return { x: 0, y: 3, z: d };
    case 'north': return { x: 0, y: 3, z: -d };
  }
}

// Arrival in the target area near an open boundary edge — preferring the edge that links back to `fromAreaId`
// (so you "walk in" from that side); otherwise the south edge as a sensible default.
export function arrivalNearBoundary(targetAreaId: string, fromAreaId: string): Vec3 {
  const edges = getWorldArea(targetAreaId)?.edges ?? {};
  const backEdge = (Object.keys(edges) as EdgeDir[]).find((e) => edges[e] === fromAreaId) ?? 'south';
  return spawnNearBoundary(targetAreaId, backEdge);
}
