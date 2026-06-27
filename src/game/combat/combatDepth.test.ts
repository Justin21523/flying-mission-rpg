import { describe, it, expect, beforeEach } from 'vitest';
import { resolveDefense, buildDefenseState, PARRY_WINDOW_MS } from './skillBehaviors';
import { statusEffectsForSkill, useStatusRuleStore } from '../../stores/game/useStatusRuleStore';
import { damageTargetsInRadius } from './CombatDirector';
import { useCombatTargetStore, liveTargets, type CombatTarget } from '../../stores/game/combatTargetStore';
import { SEED_STATUS_RULES } from '../../data/combat/statusRules';
import type { ActiveDefenseState } from '../../types/game/combat';

describe('parry window (resolveDefense)', () => {
  const base: ActiveDefenseState = { type: 'front-shield', untilMs: 10_000, value: 0.5, activatedAtMs: 1000, parryWindowMs: PARRY_WINDOW_MS };
  it('a hit inside the opening window is a full-negate parry', () => {
    const r = resolveDefense(base, 30, 1000 + 100); // within 250ms
    expect(r.wasParried).toBe(true);
    expect(r.iframed).toBe(true);
    expect(r.finalAmount).toBe(0);
  });
  it('a hit after the window is a normal block (no parry)', () => {
    const r = resolveDefense(base, 30, 1000 + 400); // past 250ms
    expect(r.wasParried).toBe(false);
    expect(r.finalAmount).toBe(15); // 50% block
  });
  it('buildDefenseState sets the parry window', () => {
    const s = buildDefenseState({ durationSeconds: 2, defenseType: 'front-shield', defenseValue: 0.5 } as never, 5000);
    expect(s.activatedAtMs).toBe(5000);
    expect(s.parryWindowMs).toBe(PARRY_WINDOW_MS);
  });
});

describe('status rules', () => {
  beforeEach(() => useStatusRuleStore.getState().importState({ items: SEED_STATUS_RULES }));
  it('maps damageType + tags to effects', () => {
    expect(statusEffectsForSkill(new Set(['fire']), new Set())).toContain('burning');
    expect(statusEffectsForSkill(new Set(), new Set(['freeze']))).toContain('frozen');
    expect(statusEffectsForSkill(new Set(['electric']), new Set())).toContain('shocked');
    expect(statusEffectsForSkill(new Set(), new Set(['heavy-impact']))).toContain('armor-broken');
    expect(statusEffectsForSkill(new Set(['impact']), new Set())).toEqual([]); // plain impact → nothing
  });
  it('disabled rules are ignored', () => {
    useStatusRuleStore.getState().importState({ items: SEED_STATUS_RULES.map((r) => ({ ...r, enabled: false })) });
    expect(statusEffectsForSkill(new Set(['fire']), new Set())).toEqual([]);
  });
});

describe('damageTargetsInRadius', () => {
  beforeEach(() => useCombatTargetStore.getState().reset());
  it('hits only enemies within the radius', () => {
    const mk = (id: string, x: number): CombatTarget => ({ id, definitionId: 'd', hp: 50, maxHp: 50, shield: 0, maxShield: 0, x, y: 0, z: 0, defeatedAt: 0, isEnemy: true });
    liveTargets.push(mk('near', 2), mk('far', 20));
    const hits = damageTargetsInRadius(0, 0, 6, { amount: 10, damageType: 'impact', attackTags: ['explosion'] });
    expect(hits).toBe(1); // only 'near'
  });
});
