// Generic object pool keyed by kind — acquire reuses an idle slot (or creates one), release returns it.
// Used by the world-flight chunk manager so long flights reuse a fixed set of props (clouds, rings,
// collectibles, markers…) instead of allocating forever. Pure + testable (no R3F).
export class FlightObjectPool<T> {
  private idle = new Map<string, T[]>();
  private active = new Map<string, Set<T>>();
  spawnedTotal = 0;
  releasedTotal = 0;

  constructor(private factory: (kind: string) => T) {}

  acquire(kind: string): T {
    const pool = this.idle.get(kind);
    const obj = pool && pool.length > 0 ? pool.pop()! : this.factory(kind);
    if (!this.active.has(kind)) this.active.set(kind, new Set());
    this.active.get(kind)!.add(obj);
    this.spawnedTotal++;
    return obj;
  }

  release(kind: string, obj: T): void {
    const set = this.active.get(kind);
    if (!set || !set.has(obj)) return;
    set.delete(obj);
    if (!this.idle.has(kind)) this.idle.set(kind, []);
    this.idle.get(kind)!.push(obj);
    this.releasedTotal++;
  }

  releaseAll(): void {
    for (const [kind, set] of this.active) {
      const pool = this.idle.get(kind) ?? [];
      for (const obj of set) {
        pool.push(obj);
        this.releasedTotal++;
      }
      set.clear();
      this.idle.set(kind, pool);
    }
  }

  activeCount(kind?: string): number {
    if (kind) return this.active.get(kind)?.size ?? 0;
    let n = 0;
    for (const set of this.active.values()) n += set.size;
    return n;
  }

  idleCount(kind?: string): number {
    if (kind) return this.idle.get(kind)?.length ?? 0;
    let n = 0;
    for (const pool of this.idle.values()) n += pool.length;
    return n;
  }
}
