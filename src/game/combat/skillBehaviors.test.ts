import { describe, it, expect } from 'vitest';
import { buildSpawnRequests, buildDefenseState, resolveDefense, isSpawnSkill, isDefenseSkill } from './skillBehaviors';
import { skill } from '../../data/combat/skillBuilders';
import type { SkillCaster } from './SkillRuntime';

const caster: SkillCaster = { characterId: 'char_jett', x: 0, y: 0, z: 0, headingRad: 0 };

describe('skillBehaviors.buildSpawnRequests', () => {
  it('builds N projectile requests with spread for a projectile skill', () => {
    const s = skill({ id: 'p', name: 'P', attackType: 'projectile', projectile: { modelAssetId: 'm', speed: 14, lifetimeSeconds: 2, movement: 'linear', radius: 2, count: 3, spreadDeg: 30 } });
    const reqs = buildSpawnRequests(s, caster);
    expect(reqs).toHaveLength(3);
    expect(reqs[0].kind).toBe('projectile');
    expect(reqs[0].modelAssetId).toBe('m');
    expect(reqs[0].faction).toBe('player');
  });

  it('builds summon requests carrying the summon damage + interval', () => {
    const s = skill({ id: 'su', name: 'Su', attackType: 'summon', summon: { modelAssetId: 'drone', count: 2, lifetimeSeconds: 10, behavior: 'seek', attackIntervalSeconds: 1, attackDamage: 9, attackRadius: 3 } });
    const reqs = buildSpawnRequests(s, caster);
    expect(reqs).toHaveLength(2);
    expect(reqs[0].kind).toBe('summon');
    expect(reqs[0].damage.amount).toBe(9);
    expect(reqs[0].attackIntervalSeconds).toBe(1);
  });

  it('builds terrain requests that block movement', () => {
    const s = skill({ id: 'w', name: 'Wall', attackType: 'terrain', terrain: { modelAssetId: 'barrier', count: 1, lifetimeSeconds: 8, radius: 2.5, blocksMovement: true } });
    const reqs = buildSpawnRequests(s, caster);
    expect(reqs[0].kind).toBe('terrain');
    expect(reqs[0].blocksMovement).toBe(true);
  });

  it('returns no requests for a non-spawn (melee) skill', () => {
    expect(buildSpawnRequests(skill({ id: 'm', name: 'M', attackType: 'melee' }), caster)).toHaveLength(0);
  });
});

describe('skillBehaviors classifiers', () => {
  it('detects spawn + defense skills', () => {
    expect(isSpawnSkill(skill({ id: 'a', name: 'a', attackType: 'projectile' }))).toBe(true);
    expect(isSpawnSkill(skill({ id: 'b', name: 'b', attackType: 'melee' }))).toBe(false);
    expect(isDefenseSkill(skill({ id: 'c', name: 'c', attackType: 'none', defenseType: 'front-shield' }))).toBe(true);
  });
});

describe('skillBehaviors defense resolution', () => {
  it('front-shield reduces damage by its value', () => {
    const state = buildDefenseState(skill({ id: 'd', name: 'd', defenseType: 'front-shield', defenseValue: 0.7, durationSeconds: 2 }), 1000);
    const out = resolveDefense(state, 100, 1500);
    expect(out.finalAmount).toBe(30);
  });

  it('iframe negates damage', () => {
    const state = buildDefenseState(skill({ id: 'd', name: 'd', defenseType: 'quick-dash-iframe', defenseValue: 1, durationSeconds: 1 }), 1000);
    expect(resolveDefense(state, 50, 1200).iframed).toBe(true);
  });

  it('absorb converts damage to energy', () => {
    const state = buildDefenseState(skill({ id: 'd', name: 'd', defenseType: 'absorb-energy', defenseValue: 1, durationSeconds: 2 }), 1000);
    const out = resolveDefense(state, 40, 1500);
    expect(out.finalAmount).toBe(0);
    expect(out.energyGain).toBe(40);
  });

  it('reflect redirects damage', () => {
    const state = buildDefenseState(skill({ id: 'd', name: 'd', defenseType: 'reflect-wall', defenseValue: 1, durationSeconds: 2 }), 1000);
    expect(resolveDefense(state, 25, 1500).reflectAmount).toBe(25);
  });

  it('expired defense lets full damage through', () => {
    const state = buildDefenseState(skill({ id: 'd', name: 'd', defenseType: 'front-shield', defenseValue: 0.7, durationSeconds: 1 }), 1000);
    expect(resolveDefense(state, 100, 5000).finalAmount).toBe(100);
  });
});
