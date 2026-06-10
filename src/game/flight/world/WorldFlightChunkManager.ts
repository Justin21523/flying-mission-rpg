// Route-progress chunk manager — keeps only the chunks near the craft alive (a window of indices around
// the current progress), spawning ahead and recycling behind so a 10-minute flight never accumulates
// objects. The chunk *payload* (visual props / pooled objects) is created/released via callbacks, so this
// class stays pure + testable; the renderer supplies the actual R3F-side spawn/release.
export interface ChunkManagerOptions<T> {
  chunkU: number; // size of a chunk in route-U (0..1)
  aheadChunks: number; // how many chunks ahead of the craft to keep
  behindChunks: number; // how many behind
  spawn: (index: number) => T;
  release: (index: number, payload: T) => void;
}

export class WorldFlightChunkManager<T> {
  private active = new Map<number, T>();
  spawnedTotal = 0;
  releasedTotal = 0;

  constructor(private opts: ChunkManagerOptions<T>) {}

  update(u: number): void {
    const { chunkU, aheadChunks, behindChunks, spawn, release } = this.opts;
    const cur = Math.floor(u / chunkU);
    const lo = cur - behindChunks;
    const hi = cur + aheadChunks;
    for (let i = Math.max(0, lo); i <= hi; i++) {
      if (!this.active.has(i)) {
        this.active.set(i, spawn(i));
        this.spawnedTotal++;
      }
    }
    for (const [i, payload] of this.active) {
      if (i < lo || i > hi) {
        release(i, payload);
        this.active.delete(i);
        this.releasedTotal++;
      }
    }
  }

  releaseAll(): void {
    for (const [i, payload] of this.active) {
      this.opts.release(i, payload);
      this.releasedTotal++;
    }
    this.active.clear();
  }

  activeIndices(): number[] {
    return [...this.active.keys()];
  }

  getDebug(): { activeChunks: number; spawnedTotal: number; releasedTotal: number } {
    return { activeChunks: this.active.size, spawnedTotal: this.spawnedTotal, releasedTotal: this.releasedTotal };
  }
}
