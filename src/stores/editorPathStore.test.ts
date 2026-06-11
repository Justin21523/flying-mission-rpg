import { describe, it, expect } from 'vitest';
import { useEditorPathStore, getPath } from './editorPathStore';
import type { PathDefinition } from '../types/path';

const path = (): PathDefinition => ({
  id: 'tp', name: 'Test', areaId: 'world',
  nodeIds: ['n0', 'n1'],
  nodes: [
    { id: 'n0', position: [0, 0, 0], tangentMode: 'automatic', speedMultiplier: 1, width: 2 },
    { id: 'n1', position: [4, 0, 0], tangentMode: 'automatic', speedMultiplier: 1, width: 2 },
  ],
  curveType: 'catmullRom', closed: false, defaultSpeed: 12, laneWidth: 2, directionMode: 'oneWay',
  entryNodeIds: ['n0'], exitNodeIds: ['n1'],
});

describe('editorPathStore node editing', () => {
  it('updatePathNode writes the new position back into the store', () => {
    useEditorPathStore.getState().importState({ paths: [path()] });
    useEditorPathStore.getState().updatePathNode('tp', 'n1', [7, 3, -2]);
    expect(getPath('tp')?.nodes?.find((n) => n.id === 'n1')?.position).toEqual([7, 3, -2]);
  });

  it('reorderNode swaps node order + keeps nodeIds in sync', () => {
    const p = path();
    p.nodes!.push({ id: 'n2', position: [8, 0, 0], tangentMode: 'automatic', speedMultiplier: 1, width: 2 });
    p.nodeIds.push('n2');
    useEditorPathStore.getState().importState({ paths: [p] });
    useEditorPathStore.getState().reorderNode('tp', 'n0', 1);
    expect(getPath('tp')?.nodes?.map((n) => n.id)).toEqual(['n1', 'n0', 'n2']);
    expect(getPath('tp')?.nodeIds).toEqual(['n1', 'n0', 'n2']);
    // bounds no-op
    useEditorPathStore.getState().reorderNode('tp', 'n1', -1);
    expect(getPath('tp')?.nodes?.map((n) => n.id)).toEqual(['n1', 'n0', 'n2']);
  });

  it('updateNode patches arbitrary node fields', () => {
    useEditorPathStore.getState().importState({ paths: [path()] });
    useEditorPathStore.getState().updateNode('tp', 'n0', { width: 5, speedMultiplier: 2 });
    const n = getPath('tp')?.nodes?.find((x) => x.id === 'n0');
    expect(n?.width).toBe(5);
    expect(n?.speedMultiplier).toBe(2);
  });

  it('removeNode drops the node and its id from nodeIds/exit/entry', () => {
    useEditorPathStore.getState().importState({ paths: [path()] });
    useEditorPathStore.getState().removeNode('tp', 'n1');
    const p = getPath('tp');
    expect(p?.nodes?.some((n) => n.id === 'n1')).toBe(false);
    expect(p?.nodeIds).not.toContain('n1');
    expect(p?.exitNodeIds).not.toContain('n1');
  });
});
