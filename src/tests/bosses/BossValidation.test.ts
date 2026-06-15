import { describe, it, expect } from 'vitest';
import { validateBoss, validatePhase, validateWeakpoint, validateAttackPattern, validateArena, validateSummonWave } from '../../game/bosses/BossValidation';
import { SEED_BOSSES } from '../../data/bosses/bossDefinitions';
import { SEED_BOSS_PHASES } from '../../data/bosses/bossPhaseDefinitions';
import { SEED_BOSS_WEAKPOINTS } from '../../data/bosses/bossWeakpointDefinitions';
import { SEED_BOSS_ATTACK_PATTERNS } from '../../data/bosses/bossAttackPatterns';
import { SEED_BOSS_ARENAS } from '../../data/bosses/bossArenaDefinitions';
import { SEED_BOSS_SUMMON_WAVES } from '../../data/bosses/bossSummonWaves';
import { SEED_BOSS_EFFECTS, HARBOR_CORE_MODEL } from '../../data/bosses/bossVisualPresets';
import { getModelAsset } from '../../data/modelLibrary';

const lk = {
  arenaExists: (id: string) => SEED_BOSS_ARENAS.some((a) => a.id === id),
  phaseExists: (id: string) => SEED_BOSS_PHASES.some((p) => p.id === id),
  weakpointExists: (id: string) => SEED_BOSS_WEAKPOINTS.some((w) => w.id === id),
  attackExists: (id: string) => SEED_BOSS_ATTACK_PATTERNS.some((a) => a.id === id),
  waveExists: (id: string) => SEED_BOSS_SUMMON_WAVES.some((w) => w.id === id),
  spawnGroupExists: () => true,
};

describe('BossValidation', () => {
  it('the seeded Harbor Core Sentinel + all content validates', () => {
    for (const b of SEED_BOSSES) expect(validateBoss(b, lk).ok, b.id).toBe(true);
    for (const p of SEED_BOSS_PHASES) expect(validatePhase(p, lk).ok, p.id).toBe(true);
    for (const w of SEED_BOSS_WEAKPOINTS) expect(validateWeakpoint(w, lk.phaseExists).ok, w.id).toBe(true);
    for (const a of SEED_BOSS_ATTACK_PATTERNS) expect(validateAttackPattern(a, lk.phaseExists).ok, a.id).toBe(true);
    for (const a of SEED_BOSS_ARENAS) expect(validateArena(a).ok, a.id).toBe(true);
    for (const w of SEED_BOSS_SUMMON_WAVES) expect(validateSummonWave(w, lk).ok, w.id).toBe(true);
  });

  it('rejects a boss whose phase is missing', () => {
    const bad = { ...SEED_BOSSES[0], phaseIds: ['nope'], startPhaseId: 'nope', finalPhaseIds: ['nope'] };
    expect(validateBoss(bad, lk).ok).toBe(false);
  });

  it('rejects a phase with no completion conditions', () => {
    expect(validatePhase({ ...SEED_BOSS_PHASES[0], completionConditions: [] }, lk).ok).toBe(false);
  });

  it('rejects a weakpoint referencing an unknown phase', () => {
    expect(validateWeakpoint({ ...SEED_BOSS_WEAKPOINTS[0], activeInPhaseIds: ['nope'] }, lk.phaseExists).ok).toBe(false);
  });

  it('rejects an arena with zero bounds', () => {
    const a = SEED_BOSS_ARENAS[0];
    expect(validateArena({ ...a, bounds: { ...a.bounds, size: [0, 0, 0] } }).ok).toBe(false);
  });

  it('boss model preset + attack visuals all resolve', () => {
    expect(getModelAsset(HARBOR_CORE_MODEL)).toBeTruthy();
    const fxIds = new Set(SEED_BOSS_EFFECTS.map((e) => e.id));
    for (const a of SEED_BOSS_ATTACK_PATTERNS) {
      if (a.warningVisualId) expect(fxIds.has(a.warningVisualId), a.id).toBe(true);
      if (a.executionVisualId) expect(fxIds.has(a.executionVisualId), a.id).toBe(true);
    }
  });
});
