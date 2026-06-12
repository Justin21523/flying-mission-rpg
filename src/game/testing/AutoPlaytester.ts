import type { GamePhase } from '../../types/game/state';
import { AUTO_PLAYTESTER_CONFIG } from './AutoPlaytesterConfig';
import { CORE_FLOW_ORDER, FINAL_PHASE, nextCorePhase, type AutoStatus } from './AutoPlaytesterStateMachine';

// Batch 13 — Debug/Test-only automated playtester. Drives the game through the core flow ONE legal
// transition at a time, issuing real inputs / runtime actions per phase (via AutoWorld) and asserting each
// step. It never jumps straight to MISSION_COMPLETE. Generic over AutoWorld so the runner is unit-testable
// with a mock world (no R3F).

export interface AutoWorld {
  phase(): GamePhase;
  go(to: GamePhase): boolean;
  ensureMissionSelected(): boolean;
  ensureCharacterSelected(): boolean;
  pressForward(): void;
  fastForwardWorldFlight(): void;
  finishTransformation(): void;
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

  constructor(private readonly world: AutoWorld, private readonly onUpdate?: (s: AutoSnapshot) => void) {}

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
    if (now - this.startMs > AUTO_PLAYTESTER_CONFIG.totalTimeoutMs) {
      return this.fail('total run timeout', now);
    }
    if (now - this.stepStartMs > AUTO_PLAYTESTER_CONFIG.stepTimeoutMs) {
      return this.fail(`stuck at ${phase} (step timeout)`, now);
    }

    if (now - this.lastActionMs < AUTO_PLAYTESTER_CONFIG.actionIntervalMs) return;
    this.lastActionMs = now;
    this.act(phase);
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

  private act(phase: GamePhase): void {
    const w = this.world;
    switch (phase) {
      case 'BOOT': w.go('MISSION_CONTROL'); this.lastAction = 'boot → mission control'; break;
      case 'MISSION_CONTROL': w.ensureMissionSelected(); w.go('MISSION_BRIEFING'); this.lastAction = 'select mission → briefing'; break;
      case 'CHARACTER_SELECTION': w.ensureCharacterSelected(); w.go('HANGAR'); this.lastAction = 'select character → hangar'; break;
      case 'HANGAR': w.pressForward(); w.go('PLATFORM_ALIGNMENT'); this.lastAction = 'move to platform'; break;
      case 'LAUNCH_TUNNEL': w.pressForward(); w.go('BASE_FLY_AROUND'); this.lastAction = 'fly through tunnel'; break;
      case 'WORLD_FLIGHT': w.fastForwardWorldFlight(); w.go('DESTINATION_APPROACH'); this.lastAction = 'follow route (debug fast-forward)'; break;
      case 'TRANSFORMATION': w.finishTransformation(); this.lastAction = 'finish transformation'; break; // director auto-advances to DESCENT
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
