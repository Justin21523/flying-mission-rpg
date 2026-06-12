import { describe, expect, it } from 'vitest';
import { visiblePathDefinitions } from './pathDebugVisibility';
import type { PathDefinition } from '../../types/path';

const path = (id: string, areaId?: string): PathDefinition => ({
  id,
  name: id,
  areaId,
  nodeIds: [],
  nodes: [],
  curveType: 'catmullRom',
  closed: false,
  defaultSpeed: 1,
  laneWidth: 1,
  directionMode: 'oneWay',
  entryNodeIds: [],
  exitNodeIds: [],
});

describe('visiblePathDefinitions', () => {
  it('filters by area when no explicit path is selected', () => {
    expect(visiblePathDefinitions([path('world-a', 'world'), path('base-a', 'exterior')], 'world').map((p) => p.id)).toEqual(['world-a']);
  });

  it('uses the explicit active path id over area filtering', () => {
    expect(visiblePathDefinitions([path('world-a', 'world'), path('world-b', 'world')], 'world', 'world-b').map((p) => p.id)).toEqual(['world-b']);
  });
});
