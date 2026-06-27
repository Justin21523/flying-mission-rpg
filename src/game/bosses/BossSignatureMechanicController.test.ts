import { describe, it, expect, beforeEach } from 'vitest';
import * as Sig from './BossSignatureMechanicController';
import type { MechanicCtx } from './BossSignatureMechanicController';
import type { BossSignatureMechanic } from '../../types/game/boss';

interface Rec { playerDamage: number; bossHeal: number; shieldRegen: number; spawned: string[] }

function makeCtx(now: number, over: Partial<MechanicCtx> = {}, rec?: Rec): MechanicCtx {
  return {
    now, phaseId: 'p1', bossPos: { x: 0, z: 0 }, playerPos: { x: 0, z: 0 }, enrageActive: false,
    applyPlayerDamage: (a) => { if (rec) rec.playerDamage += a; },
    spawnEnemy: (id) => { if (rec) rec.spawned.push(id); return `spawned_${rec?.spawned.length ?? 0}`; },
    isAlive: () => true,
    healBoss: (a) => { if (rec) rec.bossHeal += a; },
    regenBossShield: (a) => { if (rec) rec.shieldRegen += a; },
    ...over,
  };
}

beforeEach(() => Sig.reset());

describe('BossSignatureMechanicController', () => {
  it('moving-hazard-lasers schedules a strike that damages the player only if still in radius', () => {
    const rec: Rec = { playerDamage: 0, bossHeal: 0, shieldRegen: 0, spawned: [] };
    const m: BossSignatureMechanic = { id: 'm1', type: 'moving-hazard-lasers', config: { intervalSeconds: 4, warnSeconds: 1, radius: 4, damage: 14 } };
    // t=0: schedule a strike at player (0,0) resolving at t=1.
    Sig.update(m, makeCtx(0, { playerPos: { x: 0, z: 0 } }, rec));
    // t=1.1, player moved out of radius → no damage.
    Sig.update(m, makeCtx(1.1, { playerPos: { x: 20, z: 0 } }, rec));
    expect(rec.playerDamage).toBe(0);
  });

  it('moving-hazard-lasers damages a player who stays in the strike zone', () => {
    const rec: Rec = { playerDamage: 0, bossHeal: 0, shieldRegen: 0, spawned: [] };
    const m: BossSignatureMechanic = { id: 'm2', type: 'moving-hazard-lasers', config: { intervalSeconds: 4, warnSeconds: 1, radius: 4, damage: 14 } };
    Sig.update(m, makeCtx(0, { playerPos: { x: 0, z: 0 } }, rec));
    Sig.update(m, makeCtx(1.1, { playerPos: { x: 1, z: 0 } }, rec)); // still within radius 4
    expect(rec.playerDamage).toBe(14);
  });

  it('priority-healer spawns a healer and heals the boss while it lives', () => {
    const rec: Rec = { playerDamage: 0, bossHeal: 0, shieldRegen: 0, spawned: [] };
    const m: BossSignatureMechanic = { id: 'm3', type: 'priority-healer', config: { intervalSeconds: 10, healPerSec: 12, maxHealers: 1 }, enemyRef: 'repair_wisp' };
    Sig.update(m, makeCtx(0, {}, rec)); // first tick: due → spawn healer
    Sig.update(m, makeCtx(0.5, {}, rec)); // healer alive → heal
    expect(rec.spawned).toEqual(['repair_wisp']);
    expect(rec.bossHeal).toBeGreaterThan(0);
  });

  it('priority-healer stops healing once the healer dies', () => {
    const rec: Rec = { playerDamage: 0, bossHeal: 0, shieldRegen: 0, spawned: [] };
    const m: BossSignatureMechanic = { id: 'm4', type: 'priority-healer', config: { intervalSeconds: 10, healPerSec: 12, maxHealers: 1 }, enemyRef: 'repair_wisp' };
    Sig.update(m, makeCtx(0, {}, rec));
    const before = rec.bossHeal;
    Sig.update(m, makeCtx(0.5, { isAlive: () => false }, rec)); // healer dead → no heal
    expect(rec.bossHeal).toBe(before);
  });

  it('reflect-aegis regenerates boss shield and sets the reflect flag', () => {
    const rec: Rec = { playerDamage: 0, bossHeal: 0, shieldRegen: 0, spawned: [] };
    const m: BossSignatureMechanic = { id: 'm5', type: 'reflect-aegis', config: { shieldRegenPerSec: 14 } };
    Sig.update(m, makeCtx(0, {}, rec));
    Sig.update(m, makeCtx(0.1, {}, rec));
    expect(rec.shieldRegen).toBeGreaterThan(0);
    expect(Sig.getMechanicFlag('m5', 'reflect')).toBe(1);
  });

  it('blackout-pulse toggles the blackout flag over time', () => {
    const m: BossSignatureMechanic = { id: 'm6', type: 'blackout-pulse', config: { intervalSeconds: 5 } };
    Sig.update(m, makeCtx(0)); // toggles on
    expect(Sig.getMechanicFlag('m6', 'blackout')).toBe(1);
    Sig.update(m, makeCtx(5.1)); // toggles off
    expect(Sig.getMechanicFlag('m6', 'blackout')).toBe(0);
  });

  it('arena-shrink damages a player outside the safe radius', () => {
    const rec: Rec = { playerDamage: 0, bossHeal: 0, shieldRegen: 0, spawned: [] };
    const m: BossSignatureMechanic = { id: 'm7', type: 'arena-shrink', config: { intervalSeconds: 2, baseRadius: 22, minRadius: 8, shrinkSeconds: 30, damage: 10 } };
    // Player far outside even the base radius → damage on a due tick.
    Sig.update(m, makeCtx(0, { playerPos: { x: 100, z: 0 } }, rec));
    expect(rec.playerDamage).toBe(10);
  });

  it('skips phases it is not active in', () => {
    const rec: Rec = { playerDamage: 0, bossHeal: 0, shieldRegen: 0, spawned: [] };
    const m: BossSignatureMechanic = { id: 'm8', type: 'reflect-aegis', activeInPhaseIds: ['p2'], config: { shieldRegenPerSec: 14 } };
    Sig.update(m, makeCtx(0, { phaseId: 'p1' }, rec));
    Sig.update(m, makeCtx(0.1, { phaseId: 'p1' }, rec));
    expect(rec.shieldRegen).toBe(0);
  });
});
