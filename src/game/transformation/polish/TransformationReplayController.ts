import { reportStat } from '../../performance/RuntimeStatsCollector';

// Batch 12 — replay helper for the transformation timeline. Effects are keyed by id and unmount on
// reset/replay (no accumulation), but the controller makes that explicit: it zeroes the live effect count
// and resets the runner BEFORE the next playthrough, so repeated replays never stack effects. Works for
// full replay, replay-from-stage, and edit/preview previews. Decoupled via a minimal runner interface so
// it is unit-testable without a real runner.

export interface ReplayableRunner {
  reset(): void;
  seek(time: number): void;
}

export class TransformationReplayController {
  private replays = 0;

  constructor(private readonly runner: ReplayableRunner) {}

  /** Clear prior effects then restart from the top. */
  replay(): void {
    this.cleanup();
    this.runner.reset();
    this.replays += 1;
  }

  /** Clear prior effects then restart from a given time (e.g. a stage start). */
  replayFrom(time: number): void {
    this.cleanup();
    this.runner.reset();
    this.runner.seek(Math.max(0, time));
    this.replays += 1;
  }

  get replayCount(): number {
    return this.replays;
  }

  private cleanup(): void {
    // Effects are React-unmounted on reset; explicitly zero the reported count so the perf panel and any
    // pooled-effect counters return to a clean baseline before the next run.
    reportStat('effects', 0);
  }
}
