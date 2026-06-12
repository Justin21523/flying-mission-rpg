import type { GamePhase } from '../../types/game/state';
import { AUTO_PLAYTESTER_CONFIG, type AutoPlaytesterConfig } from './AutoPlaytesterConfig';
import { CORE_FLOW_ORDER, FINAL_PHASE, nextCorePhase, type AutoStatus } from './AutoPlaytesterStateMachine';

// Phases whose transition is driven by the 3D controllers (not a UI button): real-flight steers them with
// synthetic input and waits for the natural transition; a per-step timeout falls back to the debug hook.
const AUTO_PHASES = new Set<GamePhase>(['LAUNCH_TUNNEL', 'BASE_FLY_AROUND', 'CLOUD_ASCENT', 'WORLD_FLIGHT', 'TRANSFORMATION', 'DESCENT']);

// Batch 13 — Debug/Test-only automated playtester. Drives the game through the core flow ONE legal
// transition at a time, issuing real inputs / runtime actions per phase (via AutoWorld) and asserting each
// step. It never jumps straight to MISSION_COMPLETE. Generic over AutoWorld so the runner is unit-testable
// with a mock world (no R3F).

export interface AutoWorld {
  phase(): GamePhase;
  go(to: GamePhase): boolean;
  ensureMissionSelected(): boolean;
  ensureCharacterSelected(): boolean;
  /** Real input for an auto-flight phase (synthetic keys driving the live controllers). */
  steer(phase: GamePhase): void;
  /** Debug fast-forward past an auto-flight phase (used only after the per-step timeout). */
  forceAdvance(phase: GamePhase): void;
  completeObjective(): boolean;
  /** Per-phase assertion; return a failure reason or null if OK. */
  assert(phase: GamePhase): string | null;
}

export interface AutoSnapshot {
  status: AutoStatus;
  currentPhase: GamePhase | null;
  lastAction: string;
  lastAssertion: string;
  elapsedMs: number;
  failureReason: string | null;
  log: string[];
}

export class AutoPlaytester {
  status: AutoStatus = 'idle';
  private lastPhase: GamePhase | null = null;
  private startMs = 0;
  private stepStartMs = 0;
  private lastActionMs = 0;
  private lastAction = '';
  private lastAssertion = '';
  private failureReason: string | null = null;
  private log: string[] = [];

  constructor(
    private readonly world: AutoWorld,
    private readonly onUpdate?: (s: AutoSnapshot) => void,
    private readonly config: AutoPlaytesterConfig = AUTO_PLAYTESTER_CONFIG,
  ) {}

  start(now: number): void {
    this.status = 'running';
    this.lastPhase = this.world.phase();
    this.startMs = now;
    this.stepStartMs = now;
    this.lastActionMs = 0;
    this.failureReason = null;
    this.lastAction = '';
    this.lastAssertion = '';
    this.log = [`start @ ${this.lastPhase}`];
    this.emit(now);
  }

  stop(now: number): void {
    if (this.status === 'running') { this.status = 'cancelled'; this.log.push('cancelled'); this.emit(now); }
  }

  reset(now = 0): void {
    this.status = 'idle';
    this.lastPhase = null;
    this.failureReason = null;
    this.lastAction = '';
    this.lastAssertion = '';
    this.log = [];
    this.emit(now);
  }

  tick(now: number): void {
    if (this.status !== 'running') return;
    const phase = this.world.phase();

    if (phase !== this.lastPhase) {
      this.log.push(`→ ${phase} (+${Math.round((now - this.stepStartMs))}ms)`);
      this.lastPhase = phase;
      this.stepStartMs = now;
      const reason = this.world.assert(phase);
      this.lastAssertion = reason ? `FAIL: ${reason}` : `ok: ${phase}`;
      if (reason) return this.fail(`assertion at ${phase}: ${reason}`, now);
    }

    if (phase === FINAL_PHASE) {
      this.status = 'completed';
      this.log.push('completed');
      return this.emit(now);
    }
    if (phase !== 'BOOT' && !CORE_FLOW_ORDER.includes(phase)) {
      return this.fail(`left the core flow at ${phase}`, now);
    }
    if (now - this.startMs > this.config.totalTimeoutMs) {
      return this.fail('total run timeout', now);
    }
    if (now - this.stepStartMs > this.config.stepTimeoutMs) {
      return this.fail(`stuck at ${phase} (step timeout)`, now);
    }

    if (now - this.lastActionMs < this.config.actionIntervalMs) return;
    this.lastActionMs = now;
    this.act(phase, now);
    this.emit(now);
  }

  snapshot(now = this.lastActionMs): AutoSnapshot {
    return {
      status: this.status,
      currentPhase: this.lastPhase,
      lastAction: this.lastAction,
      lastAssertion: this.lastAssertion,
      elapsedMs: this.status === 'idle' ? 0 : Math.max(0, now - this.startMs),
      failureReason: this.failureReason,
      log: [...this.log],
    };
  }

  private act(phase: GamePhase, now: number): void {
    const w = this.world;

    // Controller-driven flight phases: real-flight steers and waits for the natural transition; after the
    // per-step fallback window, push past with the debug hook (still a legal flow, never a fake ending).
    if (AUTO_PHASES.has(phase)) {
      const elapsed = now - this.stepStartMs;
      if (this.config.realFlight && elapsed < this.config.flightFallbackMs) {
        w.steer(phase);
        this.lastAction = `fly ${phase} (real input)`;
      } else {
        w.forceAdvance(phase);
        const n = nextCorePhase(phase);
        if (n) w.go(n);
        this.lastAction = `force past ${phase}`;
      }
      return;
    }

    switch (phase) {
      case 'BOOT': w.go('MISSION_CONTROL'); this.lastAction = 'boot → mission control'; break;
      case 'MISSION_CONTROL': w.ensureMissionSelected(); w.go('MISSION_BRIEFING'); this.lastAction = 'select mission → briefing'; break;
      case 'CHARACTER_SELECTION': w.ensureCharacterSelected(); w.go('HANGAR'); this.lastAction = 'select character → hangar'; break;
      case 'MISSION_GAMEPLAY': w.completeObjective(); w.go('MISSION_COMPLETE'); this.lastAction = 'complete objective'; break;
      default: {
        const n = nextCorePhase(phase);
        if (n) { w.go(n); this.lastAction = `→ ${n}`; }
      }
    }
  }

  private fail(reason: string, now: number): void {
    this.status = 'failed';
    this.failureReason = reason;
    this.log.push(`FAILED: ${reason}`);
    this.emit(now);
  }

  private emit(now: number): void {
    this.onUpdate?.(this.snapshot(now));
  }
}
