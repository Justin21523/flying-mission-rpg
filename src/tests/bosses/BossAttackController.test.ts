import { describe, it, expect, beforeEach } from 'vitest';
import * as Attack from '../../game/bosses/BossAttackController';
import { SEED_BOSS_ATTACK_PATTERNS } from '../../data/bosses/bossAttackPatterns';
import type { BossAttackDeps } from '../../game/bosses/BossAttackController';

const shockwave = SEED_BOSS_ATTACK_PATTERNS.find((p) => p.id === 'atk_harbor_shockwave')!; // castTime 0.9, radius 8, dmg 14
const projectile = SEED_BOSS_ATTACK_PATTERNS.find((p) => p.id === 'atk_harbor_projectile')!;

let dmg = 0;
let projectiles = 0;
const deps = (now: number): BossAttackDeps => ({
  now, bossPos: { x: 0, z: 0 }, playerPos: { x: 1, z: 0 }, damageMultiplier: 1,
  damagePlayer: (a) => { dmg += a; },
  spawnProjectile: () => { projectiles += 1; },
  triggerSummonWave: () => {},
  playVisual: () => {},
});

beforeEach(() => { Attack.reset(); dmg = 0; projectiles = 0; });

describe('BossAttackController', () => {
  it('warns, waits the cast time, then executes a damage event', () => {
    const e0 = Attack.update([shockwave], deps(0));
    expect(e0.some((x) => x.kind === 'warning')).toBe(true);
    expect(Attack.update([shockwave], deps(0.5))).toEqual([]); // still warming up
    const e1 = Attack.update([shockwave], deps(1.0));
    expect(e1.some((x) => x.kind === 'execute')).toBe(true);
    expect(dmg).toBe(14); // player in range
  });

  it('respects the cooldown after executing', () => {
    Attack.update([shockwave], deps(0));
    Attack.update([shockwave], deps(1.0)); // execute → readyAt = 1.0 + cooldown
    expect(Attack.update([shockwave], deps(1.2))).toEqual([]);
  });

  it('spawns a projectile for targeted-projectile attacks', () => {
    Attack.update([projectile], deps(0)); // warning (castTime 0.6)
    Attack.update([projectile], deps(0.7)); // execute → spawnProjectile
    expect(projectiles).toBe(1);
  });

  it('can interrupt a warming-up attack', () => {
    Attack.update([shockwave], deps(0)); // warning
    expect(Attack.interruptPattern(shockwave.id, 0)).toBe(true);
    expect(Attack.update([shockwave], deps(0.95))).toEqual([]); // interrupted, no execute
  });
});
