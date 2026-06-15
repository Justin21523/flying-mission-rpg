import { describe, it, expect, beforeEach } from 'vitest';
import { bossActivePhase, synthDamageable, spawnEnemyFromDef } from './enemyRuntime';
import { useCombatTargetStore, liveTargets } from '../../stores/game/combatTargetStore';
import { SEED_BOSS_PHASES, SEED_ENEMIES } from '../../data/combat/enemyDefinitions';

beforeEach(() => useCombatTargetStore.getState().reset());

describe('bossActivePhase', () => {
  const phases = SEED_BOSS_PHASES.filter((p) => p.bossId === 'boss_crystal');
  it('returns phase 1 at full HP', () => {
    expect(bossActivePhase(phases, 1.0)?.order).toBe(1);
  });
  it('enters phase 2 below its threshold', () => {
    expect(bossActivePhase(phases, 0.6)?.order).toBe(2);
  });
  it('enters phase 3 at low HP', () => {
    expect(bossActivePhase(phases, 0.2)?.order).toBe(3);
  });
});

describe('synthDamageable', () => {
  it('carries the enemy weakness/resistance + shield rules', () => {
    const sentry = SEED_ENEMIES.find((e) => e.id === 'enemy_robot_sentry')!;
    const d = synthDamageable(sentry);
    expect(d.weaknessTags).toContain('shield-break');
    expect(d.shieldRules?.enabled).toBe(true);
  });
});

describe('spawnEnemyFromDef', () => {
  it('registers a live enemy target carrying its skills', () => {
    const cat = SEED_ENEMIES.find((e) => e.id === 'enemy_warrior_cat')!;
    spawnEnemyFromDef(cat, 5, 5);
    expect(liveTargets).toHaveLength(1);
    expect(liveTargets[0].isEnemy).toBe(true);
    expect(liveTargets[0].skillIds).toEqual(cat.skillIds);
  });
});
