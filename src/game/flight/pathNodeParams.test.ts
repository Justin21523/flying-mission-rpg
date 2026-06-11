import { describe, it, expect } from 'vitest';
import { sampleNodeParams } from './pathNodeParams';
import type { PathDefinition, PathNodeData } from '../../types/path';

const node = (id: string, speedMultiplier: number, bankDeg?: number): PathNodeData => ({
  id, position: [0, 0, 0], tangentMode: 'automatic', speedMultiplier, width: 2, bankDeg,
});

const path = (nodes: PathNodeData[]): PathDefinition => ({
  id: 'p', name: 'P', nodeIds: nodes.map((n) => n.id), nodes,
  curveType: 'catmullRom', closed: false, defaultSpeed: 10, laneWidth: 2, directionMode: 'oneWay',
  entryNodeIds: [], exitNodeIds: [],
});

describe('sampleNodeParams', () => {
  const p = path([node('a', 1, 0), node('b', 2, 30), node('c', 0.5, -45)]);
  it('u=0 → first node', () => {
    expect(sampleNodeParams(p, 0)).toEqual({ speedMul: 1, bankDeg: 0 });
  });
  it('u=0.5 → middle node', () => {
    expect(sampleNodeParams(p, 0.5)).toEqual({ speedMul: 2, bankDeg: 30 });
  });
  it('u=1 → last node', () => {
    expect(sampleNodeParams(p, 1)).toEqual({ speedMul: 0.5, bankDeg: -45 });
  });
  it('missing fields default to neutral (1 / 0)', () => {
    const q = path([{ id: 'x', position: [0, 0, 0], tangentMode: 'automatic', speedMultiplier: 1, width: 2 }]);
    expect(sampleNodeParams(q, 0.5)).toEqual({ speedMul: 1, bankDeg: 0 });
  });
  it('no path → neutral', () => {
    expect(sampleNodeParams(undefined, 0.3)).toEqual({ speedMul: 1, bankDeg: 0 });
  });
});
