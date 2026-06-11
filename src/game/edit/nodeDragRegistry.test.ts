import { describe, it, expect } from 'vitest';
import { applyBatchDelta, registerNode, unregisterNode, snapshotExtras, type BatchStart } from './nodeDragRegistry';

describe('applyBatchDelta', () => {
  it('shifts each extra by the primary delta', () => {
    const start: BatchStart = {
      primary: [0, 0, 0],
      extras: [
        { key: 'a', start: [10, 0, 0] },
        { key: 'b', start: [0, 5, -2] },
      ],
    };
    const out = applyBatchDelta(start, [1, 2, 3]);
    expect(out).toEqual([
      { key: 'a', pos: [11, 2, 3] },
      { key: 'b', pos: [1, 7, 1] },
    ]);
  });
  it('no extras → empty', () => {
    expect(applyBatchDelta({ primary: [0, 0, 0], extras: [] }, [5, 5, 5])).toEqual([]);
  });
  it('zero delta leaves extras put', () => {
    const out = applyBatchDelta({ primary: [3, 3, 3], extras: [{ key: 'a', start: [9, 9, 9] }] }, [3, 3, 3]);
    expect(out).toEqual([{ key: 'a', pos: [9, 9, 9] }]);
  });
});

describe('snapshotExtras', () => {
  it('reads live positions of registered keys, skipping unregistered', () => {
    registerNode('n1', { getPos: () => [1, 2, 3], move: () => {} });
    registerNode('n2', { getPos: () => [4, 5, 6], move: () => {} });
    expect(snapshotExtras(['n1', 'n2', 'missing'])).toEqual([
      { key: 'n1', start: [1, 2, 3] },
      { key: 'n2', start: [4, 5, 6] },
    ]);
    unregisterNode('n1');
    unregisterNode('n2');
    expect(snapshotExtras(['n1', 'n2'])).toEqual([]);
  });
});
