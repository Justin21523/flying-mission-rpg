import { describe, it, expect } from 'vitest';
import { evaluateStartCondition, isPhaseComplete, nextPhaseId, isFinalPhase, type BossPhaseProbe } from '../../game/bosses/BossPhaseController';
import { SEED_BOSS_PHASES } from '../../data/bosses/bossPhaseDefinitions';

const probe = (over: Partial<BossPhaseProbe> = {}): BossPhaseProbe => ({
  bossHpPercent: 1,
  destroyedWeakpointIds: new Set(),
  clearedSummonWaveIds: new Set(),
  clearedObstacleIds: new Set(),
  usedSupportAbilityIds: new Set(),
  completedPhaseIds: new Set(),
  phaseElapsedSeconds: 0,
  ...over,
});

const p1 = SEED_BOSS_PHASES.find((p) => p.id === 'phase_harbor_p1')!;
const p2 = SEED_BOSS_PHASES.find((p) => p.id === 'phase_harbor_p2')!;
const p3 = SEED_BOSS_PHASES.find((p) => p.id === 'phase_harbor_p3')!;

describe('BossPhaseController', () => {
  it('phase 1 starts on boss start', () => {
    expect(evaluateStartCondition(p1.startCondition, probe())).toBe(true);
  });

  it('phase 2 starts only after phase 1 completes', () => {
    expect(evaluateStartCondition(p2.startCondition, probe())).toBe(false);
    expect(evaluateStartCondition(p2.startCondition, probe({ completedPhaseIds: new Set(['phase_harbor_p1']) }))).toBe(true);
  });

  it('destroying the core weakpoint completes phase 1', () => {
    expect(isPhaseComplete(p1, probe())).toBe(false);
    expect(isPhaseComplete(p1, probe({ destroyedWeakpointIds: new Set(['wp_core']) }))).toBe(true);
  });

  it('clearing the summon wave completes phase 2', () => {
    expect(isPhaseComplete(p2, probe({ clearedSummonWaveIds: new Set(['wave_harbor_summon']) }))).toBe(true);
  });

  it('debug-complete short-circuits completion', () => {
    expect(isPhaseComplete(p1, probe({ debugCompletePhase: true }))).toBe(true);
  });

  it('phase 3 is the final phase', () => {
    expect(isFinalPhase(p3, ['phase_harbor_p3'])).toBe(true);
    expect(isFinalPhase(p1, ['phase_harbor_p3'])).toBe(false);
    expect(nextPhaseId(p1)).toBe('phase_harbor_p2');
  });
});
