import { describe, expect, it } from 'vitest';
import type { PathDefinition, PathNodeData } from '../../types/path';
import { flightTimelineInsertPoint, flightTimelineRouteNodeMarkers } from './flightTimelineRouteNodes';

const node = (id: string, x: number): PathNodeData => ({
  id,
  position: [x, 10, 0],
  tangentMode: 'automatic',
  speedMultiplier: 1,
  width: 4,
});

const path = (nodes: PathNodeData[]): PathDefinition => ({
  id: `p_${nodes.map((n) => n.id).join('_')}`,
  name: 'Test Path',
  areaId: 'world',
  nodeIds: nodes.map((n) => n.id),
  nodes,
  curveType: 'catmullRom',
  closed: false,
  defaultSpeed: 10,
  laneWidth: 4,
  directionMode: 'oneWay',
  entryNodeIds: [nodes[0]?.id ?? ''],
  exitNodeIds: [nodes[nodes.length - 1]?.id ?? ''],
});

describe('flightTimelineRouteNodes', () => {
  it('maps path nodes to forward timeline progress', () => {
    const markers = flightTimelineRouteNodeMarkers(path([node('a', 0), node('b', 10), node('c', 20)]), 'forward');
    expect(markers.map((marker) => marker.id)).toEqual(['a', 'b', 'c']);
    expect(markers[0].timelineU).toBeLessThan(0.05);
    expect(markers[2].timelineU).toBeGreaterThan(0.95);
  });

  it('reverses timeline progress for return legs', () => {
    const markers = flightTimelineRouteNodeMarkers(path([node('a', 0), node('b', 10), node('c', 20)]), 'reverse');
    expect(markers[0].timelineU).toBeGreaterThan(0.95);
    expect(markers[2].timelineU).toBeLessThan(0.05);
  });

  it('computes an insert point from scrub progress', () => {
    const insert = flightTimelineInsertPoint(path([node('a', 0), node('b', 10), node('c', 20)]), 0.5, 'forward');
    expect(insert?.index).toBe(2);
    expect(insert?.position[0]).toBeCloseTo(10, 1);
  });
});
