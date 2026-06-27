import { describe, it, expect } from 'vitest';
import {
  EXTRA_BOSSES, EXTRA_BOSS_PHASES, EXTRA_BOSS_WEAKPOINTS, EXTRA_BOSS_ATTACKS, EXTRA_BOSS_ARENAS,
  EXTRA_BOSS_SUMMON_WAVES, EXTRA_BOSS_SUMMON_GROUPS,
} from './extraZoneBosses';
import { SEED_BOSSES } from './bossDefinitions';
import { SEED_RANDOM_BOSS_POOLS } from './randomBossPools';
import { validateBoss, validatePhase, validateWeakpoint, validateAttackPattern, validateArena, validateSummonWave } from '../../game/bosses/BossValidation';

// Build existence lookups from the combined seed + extra content (the runtime stores merge both at boot).
const arenaIds = new Set([...EXTRA_BOSS_ARENAS].map((a) => a.id));
const phaseIds = new Set(EXTRA_BOSS_PHASES.map((p) => p.id));
const weakpointIds = new Set(EXTRA_BOSS_WEAKPOINTS.map((w) => w.id));
const attackIds = new Set(EXTRA_BOSS_ATTACKS.map((a) => a.id));
const waveIds = new Set(EXTRA_BOSS_SUMMON_WAVES.map((w) => w.id));
const groupIds = new Set(EXTRA_BOSS_SUMMON_GROUPS.map((g) => g.id));
const allBossIds = new Set([...SEED_BOSSES, ...EXTRA_BOSSES].map((b) => b.id));

const lookups = {
  arenaExists: (id: string) => arenaIds.has(id),
  phaseExists: (id: string) => phaseIds.has(id),
  weakpointExists: (id: string) => weakpointIds.has(id),
  attackExists: (id: string) => attackIds.has(id),
  waveExists: (id: string) => waveIds.has(id),
  spawnGroupExists: (id: string) => groupIds.has(id),
};

describe('extraZoneBosses — signature bosses', () => {
  it('generates 8 bosses with self-consistent family content (7 zone bosses + W1 skyport elite)', () => {
    expect(EXTRA_BOSSES).toHaveLength(8);
    expect(EXTRA_BOSS_PHASES).toHaveLength(24);
    expect(EXTRA_BOSS_WEAKPOINTS).toHaveLength(16);
    expect(EXTRA_BOSS_ATTACKS).toHaveLength(40);
    expect(EXTRA_BOSS_ARENAS).toHaveLength(8);
    expect(EXTRA_BOSS_SUMMON_WAVES).toHaveLength(8);
    expect(EXTRA_BOSS_SUMMON_GROUPS).toHaveLength(8);
  });

  it('every boss / phase / weakpoint / attack / arena / wave validates', () => {
    for (const b of EXTRA_BOSSES) expect(validateBoss(b, lookups).errors, b.id).toEqual([]);
    for (const p of EXTRA_BOSS_PHASES) expect(validatePhase(p, lookups).errors, p.id).toEqual([]);
    for (const w of EXTRA_BOSS_WEAKPOINTS) expect(validateWeakpoint(w, lookups.phaseExists).errors, w.id).toEqual([]);
    for (const a of EXTRA_BOSS_ATTACKS) expect(validateAttackPattern(a, lookups.phaseExists).errors, a.id).toEqual([]);
    for (const ar of EXTRA_BOSS_ARENAS) expect(validateArena(ar).errors, ar.id).toEqual([]);
    for (const wv of EXTRA_BOSS_SUMMON_WAVES) expect(validateSummonWave(wv, lookups).errors, wv.id).toEqual([]);
  });

  it('bosses use sentinel segmentIds so they never auto-trigger from a real segment', () => {
    for (const b of EXTRA_BOSSES) expect(b.segmentId.startsWith('random_only_')).toBe(true);
  });

  it('every random boss pool candidate resolves to a real boss', () => {
    for (const pool of SEED_RANDOM_BOSS_POOLS) {
      expect(pool.candidates.length, pool.id).toBeGreaterThan(0);
      for (const c of pool.candidates) expect(allBossIds.has(c.bossId), `${pool.id} → ${c.bossId}`).toBe(true);
    }
  });
});
