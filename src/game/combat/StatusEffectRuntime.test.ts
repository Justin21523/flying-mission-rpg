import { describe, it, expect, beforeEach } from 'vitest';
import { applyStatusEffect, getTargetStatusEffects, DEFAULT_STATUS_EFFECT_TUNING } from './StatusEffectRuntime';
import { useCombatTargetStore, type CombatTarget } from '../../stores/game/combatTargetStore';

function makeEnemy(id: string): CombatTarget {
  return { id, definitionId: 'crusher_drone', hp: 100, maxHp: 100, shield: 0, maxShield: 0, x: 0, y: 0, z: 0, defeatedAt: 0, isEnemy: true, aiData: {}, statusEffects: [] };
}

beforeEach(() => useCombatTargetStore.getState().reset());

describe('StatusEffectRuntime', () => {
  it('Wave 5 — slowed reuses the freeze move-speed seam (sets aiData.freezeMultiplier)', () => {
    const e = makeEnemy('s1');
    useCombatTargetStore.getState().spawn(e); // pushes the same ref → applyStatusEffect mutates e in place
    applyStatusEffect('s1', 'slowed', 'test');
    expect(e.aiData?.freezeMultiplier).toBe(DEFAULT_STATUS_EFFECT_TUNING.slowed.magnitude); // 0.45
    expect((e.aiData?.freezeUntil ?? 0)).toBeGreaterThan(0);
    expect(getTargetStatusEffects('s1').some((s) => s.type === 'slowed')).toBe(true);
  });

  it('bleed is a real DoT status (has tuning + applies)', () => {
    const e = makeEnemy('b1');
    useCombatTargetStore.getState().spawn(e);
    expect(DEFAULT_STATUS_EFFECT_TUNING.bleed.magnitude).toBeGreaterThan(0);
    applyStatusEffect('b1', 'bleed', 'test');
    expect(getTargetStatusEffects('b1').some((s) => s.type === 'bleed')).toBe(true);
  });

  it('Wave 6 — poise-broken is a real damage-window status (tuning + applies)', () => {
    const e = makeEnemy('pb1');
    useCombatTargetStore.getState().spawn(e);
    expect(DEFAULT_STATUS_EFFECT_TUNING['poise-broken'].magnitude).toBeGreaterThan(0); // +damage-taken fraction
    applyStatusEffect('pb1', 'poise-broken', 'poise');
    expect(getTargetStatusEffects('pb1').some((s) => s.type === 'poise-broken')).toBe(true);
  });
});
