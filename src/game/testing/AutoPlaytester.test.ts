import { describe, it, expect } from 'vitest';
import { AutoPlaytester, type AutoWorld } from './AutoPlaytester';
import { CORE_FLOW_ORDER } from './AutoPlaytesterStateMachine';
import { AUTO_PLAYTESTER_CONFIG } from './AutoPlaytesterConfig';
import type { GamePhase } from '../../types/game/state';

const fastConfig = { ...AUTO_PLAYTESTER_CONFIG, realFlight: false };

// A mock world that advances its phase on go()/finishTransformation() — lets us drive the runner to
// completion without R3F.
function makeWorld(overrides: Partial<AutoWorld> = {}): { world: AutoWorld; setPhase: (p: GamePhase) => void } {
  let phase: GamePhase = 'MISSION_CONTROL';
  const world: AutoWorld = {
    phase: () => phase,
    go: (to) => { phase = to; return true; },
    ensureMissionSelected: () => true,
    ensureCharacterSelected: () => true,
    steer: () => {}, // real input is a no-op in the mock
    forceAdvance: () => {}, // the runner calls go(next) after forceAdvance
    completeObjective: () => true,
    assert: () => null,
    ...overrides,
  };
  return { world, setPhase: (p) => { phase = p; } };
}

function run(ap: AutoPlaytester, ticks = 200): void {
  let t = 0;
  ap.start(0);
  for (let i = 0; i < ticks && ap.status === 'running'; i += 1) { t += 350; ap.tick(t); }
}

describe('AutoPlaytester', () => {
  it('drives the mock world all the way to completed', () => {
    const { world } = makeWorld();
    const ap = new AutoPlaytester(world, undefined, fastConfig);
    run(ap);
    expect(ap.status).toBe('completed');
    expect(ap.snapshot().currentPhase).toBe('MISSION_COMPLETE');
  });

  it('real-flight steers auto phases then falls back on timeout, still completing', () => {
    let steered = 0;
    const { world } = makeWorld({ steer: () => { steered += 1; } });
    const ap = new AutoPlaytester(world, undefined, { ...AUTO_PLAYTESTER_CONFIG, realFlight: true, flightFallbackMs: 700 });
    run(ap);
    expect(steered).toBeGreaterThan(0);          // it tried real input
    expect(ap.status).toBe('completed');         // and the fallback still got it home
  });

  it('fails with a step timeout when a phase never advances', () => {
    const { world } = makeWorld({ go: () => false });
    const ap = new AutoPlaytester(world);
    ap.start(0);
    ap.tick(0);
    ap.tick(20_000); // beyond the step timeout
    expect(ap.status).toBe('failed');
    expect(ap.snapshot().failureReason).toMatch(/stuck/);
  });

  it('cancels on stop', () => {
    const { world } = makeWorld();
    const ap = new AutoPlaytester(world);
    ap.start(0);
    ap.stop(1);
    expect(ap.status).toBe('cancelled');
  });

  it('fails and records the reason on an assertion failure', () => {
    const { world } = makeWorld({ assert: (p) => (p === 'HANGAR' ? 'broken' : null) });
    const ap = new AutoPlaytester(world, undefined, fastConfig);
    run(ap);
    expect(ap.status).toBe('failed');
    expect(ap.snapshot().failureReason).toContain('broken');
  });
});

describe('core flow order matches the legal transition table', () => {
  it('every consecutive AutoPlaytester step is a legal FSM transition', async () => {
    const { canTransition } = await import('../core/GameStateMachine');
    for (let i = 0; i < CORE_FLOW_ORDER.length - 1; i += 1) {
      expect(canTransition(CORE_FLOW_ORDER[i], CORE_FLOW_ORDER[i + 1])).toBe(true);
    }
  });
});
