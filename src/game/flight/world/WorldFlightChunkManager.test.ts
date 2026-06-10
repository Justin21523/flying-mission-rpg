import { describe, it, expect } from 'vitest';
import { WorldFlightChunkManager } from './WorldFlightChunkManager';

function make() {
  const released: number[] = [];
  const mgr = new WorldFlightChunkManager<number>({
    chunkU: 0.1,
    aheadChunks: 2,
    behindChunks: 1,
    spawn: (i) => i,
    release: (i) => released.push(i),
  });
  return { mgr, released };
}

describe('WorldFlightChunkManager', () => {
  it('keeps a window of chunks around the current progress', () => {
    const { mgr } = make();
    mgr.update(0); // cur=0 → [max(0,-1)..2] = 0,1,2
    expect(mgr.activeIndices().sort((a, b) => a - b)).toEqual([0, 1, 2]);
  });

  it('spawns ahead and recycles behind as progress advances', () => {
    const { mgr, released } = make();
    mgr.update(0); // 0,1,2
    mgr.update(0.35); // cur=3 → [2..5]; 0,1 recycled
    expect(mgr.activeIndices().sort((a, b) => a - b)).toEqual([2, 3, 4, 5]);
    expect(released).toContain(0);
    expect(released).toContain(1);
  });

  it('releaseAll empties active set', () => {
    const { mgr } = make();
    mgr.update(0.5);
    expect(mgr.activeIndices().length).toBeGreaterThan(0);
    mgr.releaseAll();
    expect(mgr.activeIndices().length).toBe(0);
  });
});
