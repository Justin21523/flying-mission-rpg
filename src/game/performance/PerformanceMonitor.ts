// Batch 12 — pure frame-timing monitor. Fed a per-frame dt (seconds) by the sampler; keeps a rolling
// window of frame times for FPS / avg / min / max, plus an optional JS heap estimate where the browser
// exposes it. No allocations per sample beyond the bounded ring buffer.

interface PerfMemory {
  usedJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export class PerformanceMonitor {
  private readonly capacity: number;
  private readonly frameMs: number[] = [];
  private head = 0;
  private count = 0;
  private minMs = Infinity;
  private maxMs = 0;

  constructor(capacity = 120) {
    this.capacity = Math.max(8, capacity);
  }

  sample(dtSeconds: number): void {
    const ms = Math.max(0, dtSeconds * 1000);
    if (this.count < this.capacity) {
      this.frameMs.push(ms);
      this.count += 1;
    } else {
      this.frameMs[this.head] = ms;
      this.head = (this.head + 1) % this.capacity;
    }
    if (ms < this.minMs) this.minMs = ms;
    if (ms > this.maxMs) this.maxMs = ms;
  }

  get avgFrameTime(): number {
    if (this.count === 0) return 0;
    let sum = 0;
    for (let i = 0; i < this.count; i += 1) sum += this.frameMs[i];
    return sum / this.count;
  }

  get fps(): number {
    const avg = this.avgFrameTime;
    return avg > 0 ? 1000 / avg : 0;
  }

  get minFrameTime(): number {
    return this.minMs === Infinity ? 0 : this.minMs;
  }

  get maxFrameTime(): number {
    return this.maxMs;
  }

  /** Used JS heap in MB, or null when the browser doesn't expose it. */
  memoryMb(): number | null {
    const perf = (typeof performance !== 'undefined' ? performance : undefined) as (Performance & { memory?: PerfMemory }) | undefined;
    const mem = perf?.memory;
    if (!mem) return null;
    return Math.round(mem.usedJSHeapSize / (1024 * 1024));
  }

  reset(): void {
    this.frameMs.length = 0;
    this.head = 0;
    this.count = 0;
    this.minMs = Infinity;
    this.maxMs = 0;
  }
}

// Shared monitor instance fed by the in-canvas sampler.
export const performanceMonitor = new PerformanceMonitor();
