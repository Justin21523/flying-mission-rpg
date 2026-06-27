import { describe, it, expect } from 'vitest';
import { resolveDamage } from './DamageResolver';
import type { DamageEvent, DamageableDefinition } from '../../types/game/combat';

const event = (patch: Partial<DamageEvent> = {}): DamageEvent => ({
  id: 'e1',
  sourceId: 'p',
  sourceType: 'player',
  targetId: 't1',
  targetType: 'dummy',
  amount: 20,
  damageType: 'impact',
  attackTags: [],
  ...patch,
});

const def = (patch: Partial<DamageableDefinition> = {}): DamageableDefinition => ({
  id: 't1',
  maxHp: 100,
  weaknessTags: [],
  resistanceTags: [],
  onHpZero: 'destroy',
  ...patch,
});

describe('resolveDamage', () => {
  it('applies plain damage to HP', () => {
    const r = resolveDamage(event(), def(), { hp: 100, shield: 0 });
    expect(r.hpDamage).toBe(20);
    expect(r.shieldDamage).toBe(0);
    expect(r.finalAmount).toBe(20);
  });

  it('consumes shield before HP', () => {
    const d = def({ shieldRules: { enabled: true, shieldHp: 30, shieldWeaknessTags: [], shieldBreakStaggerSeconds: 1 } });
    const r = resolveDamage(event({ amount: 50 }), d, { hp: 100, shield: 30 });
    expect(r.shieldDamage).toBe(30);
    expect(r.hpDamage).toBe(20);
    expect(r.shieldBroken).toBe(true);
  });

  it('amplifies weakness hits', () => {
    const r = resolveDamage(event({ damageType: 'energy' }), def({ weaknessTags: ['energy'] }), { hp: 100, shield: 0 });
    expect(r.wasWeaknessHit).toBe(true);
    expect(r.hpDamage).toBe(30); // 20 * 1.5
  });

  it('reduces resisted hits', () => {
    const r = resolveDamage(event(), def({ resistanceTags: ['impact'] }), { hp: 100, shield: 0 });
    expect(r.wasResisted).toBe(true);
    expect(r.hpDamage).toBe(10); // 20 * 0.5
  });

  it('zeroes immune hits', () => {
    const r = resolveDamage(event({ damageType: 'repair' }), def({ immuneTags: ['repair'] }), { hp: 100, shield: 0 });
    expect(r.wasImmune).toBe(true);
    expect(r.finalAmount).toBe(0);
  });

  it('shield-break tag strips the whole shield', () => {
    const d = def({ shieldRules: { enabled: true, shieldHp: 60, shieldWeaknessTags: ['shield-break'], shieldBreakStaggerSeconds: 1 } });
    const r = resolveDamage(event({ damageType: 'shield-break', amount: 10 }), d, { hp: 100, shield: 60 });
    expect(r.shieldBroken).toBe(true);
    expect(r.shieldDamage).toBe(60);
  });

  it('flags defeat when HP would reach 0', () => {
    const r = resolveDamage(event({ amount: 100 }), def(), { hp: 80, shield: 0 });
    expect(r.targetDefeated).toBe(true);
  });

  it('applies crit when forced', () => {
    const r = resolveDamage(event({ canCrit: true, critMultiplier: 2, metadata: { forceCrit: true } }), def(), { hp: 100, shield: 0 });
    expect(r.wasCrit).toBe(true);
    expect(r.hpDamage).toBe(40);
  });

  it('crits at 100% crit chance and never at 0% (Wave 3 critChanceAdd seam)', () => {
    const always = resolveDamage(event({ canCrit: true, critMultiplier: 2, metadata: { critChanceAdd: 1 } }), def(), { hp: 100, shield: 0 });
    expect(always.wasCrit).toBe(true);
    expect(always.hpDamage).toBe(40);
    const never = resolveDamage(event({ canCrit: true, critMultiplier: 2, metadata: { critChanceAdd: 0 } }), def(), { hp: 100, shield: 0 });
    expect(never.wasCrit).toBe(false);
    expect(never.hpDamage).toBe(20);
  });

  it('does not crit from chance when canCrit is false', () => {
    const r = resolveDamage(event({ canCrit: false, critMultiplier: 2, metadata: { critChanceAdd: 1 } }), def(), { hp: 100, shield: 0 });
    expect(r.wasCrit).toBe(false);
  });
});
