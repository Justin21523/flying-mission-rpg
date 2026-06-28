import { describe, it, expect, beforeEach } from 'vitest';
import { tryTriggerReaction, type ReactionDeps } from './ElementReactionRuntime';
import { applyStatusEffect, getTargetStatusEffects } from './StatusEffectRuntime';
import { useCombatTargetStore, type CombatTarget } from '../../stores/game/combatTargetStore';
import { useElementReactionStore } from '../../stores/game/useElementReactionStore';
import { SEED_ELEMENT_REACTIONS } from '../../data/combat/elementReactions';

function makeEnemy(id: string): CombatTarget {
  return {
    id, definitionId: 'crusher_drone', hp: 100, maxHp: 100, shield: 0, maxShield: 0,
    x: 0, y: 0, z: 0, defeatedAt: 0, isEnemy: true, aiData: {}, statusEffects: [],
  };
}

// Records calls instead of routing through CombatDirector (deps are injected).
function recordingDeps(nowMs = 1000): ReactionDeps & { single: number[]; aoe: { x: number; z: number; r: number }[] } {
  const single: number[] = [];
  const aoe: { x: number; z: number; r: number }[] = [];
  return {
    nowMs, single, aoe,
    damageTarget: (_id, tpl) => single.push(tpl.amount),
    damageInRadius: (x, z, r) => aoe.push({ x, z, r }),
  };
}

beforeEach(() => {
  useElementReactionStore.getState().importState({ items: SEED_ELEMENT_REACTIONS });
  useCombatTargetStore.getState().reset();
});

describe('ElementReactionRuntime', () => {
  it('fires shatter when a frozen enemy is shocked (consumes frozen, deals burst)', () => {
    const e = makeEnemy('e1');
    useCombatTargetStore.getState().spawn(e);
    applyStatusEffect('e1', 'frozen', 'test');
    const deps = recordingDeps();
    const fired = tryTriggerReaction('e1', 'shocked', 'test', deps);
    expect(fired).toBe('shatter');
    expect(deps.single).toEqual([45]);
    // frozen consumed (shatter has consumesPrimary: true)
    expect(getTargetStatusEffects('e1').some((s) => s.type === 'frozen')).toBe(false);
  });

  it('overload splashes AoE when a burning enemy is shocked', () => {
    const e = makeEnemy('e2');
    useCombatTargetStore.getState().spawn(e);
    applyStatusEffect('e2', 'burning', 'test');
    const deps = recordingDeps();
    const fired = tryTriggerReaction('e2', 'shocked', 'test', deps);
    expect(fired).toBe('overload');
    expect(deps.aoe.length).toBe(1);
    expect(deps.aoe[0].r).toBe(6);
  });

  it('does not fire without a matching primary status', () => {
    const e = makeEnemy('e3');
    useCombatTargetStore.getState().spawn(e);
    const deps = recordingDeps();
    expect(tryTriggerReaction('e3', 'shocked', 'test', deps)).toBeNull();
    expect(deps.single.length).toBe(0);
  });

  it('respects the per-target cooldown', () => {
    const e = makeEnemy('e4');
    useCombatTargetStore.getState().spawn(e);
    applyStatusEffect('e4', 'shocked', 'test'); // shocked + shocked → conduct (does NOT consume primary)
    expect(tryTriggerReaction('e4', 'shocked', 'test', recordingDeps(1000))).toBe('conduct');
    // within cooldown window → no second reaction
    expect(tryTriggerReaction('e4', 'shocked', 'test', recordingDeps(1200))).toBeNull();
    // after cooldown (conduct cooldownMs 1000) → fires again
    expect(tryTriggerReaction('e4', 'shocked', 'test', recordingDeps(2000))).toBe('conduct');
  });

  it('skips disabled rules', () => {
    useElementReactionStore.getState().update('rxn_shatter', { enabled: false });
    const e = makeEnemy('e5');
    useCombatTargetStore.getState().spawn(e);
    applyStatusEffect('e5', 'frozen', 'test');
    expect(tryTriggerReaction('e5', 'shocked', 'test', recordingDeps())).toBeNull();
  });

  // Wave 4 — chains & propagation.
  it('resultsInStatus applies a new status to the primary target (chain enabler)', () => {
    useElementReactionStore.getState().importState({ items: [
      { id: 'rxn_chain', reaction: 'meltdown', primaryStatus: 'frozen', triggerStatus: 'burning', bonusDamage: 10, consumesPrimary: true, resultsInStatus: 'armor-broken', enabled: true },
    ] });
    const e = makeEnemy('c1');
    useCombatTargetStore.getState().spawn(e);
    applyStatusEffect('c1', 'frozen', 'test');
    expect(tryTriggerReaction('c1', 'burning', 'test', recordingDeps())).toBe('meltdown');
    expect(getTargetStatusEffects('c1').some((s) => s.type === 'armor-broken')).toBe(true);
    expect(getTargetStatusEffects('c1').some((s) => s.type === 'frozen')).toBe(false); // primary consumed
  });

  it('propagatesStatus spreads a status to enemies within radius', () => {
    useElementReactionStore.getState().importState({ items: [
      { id: 'rxn_spread', reaction: 'overload', primaryStatus: 'burning', triggerStatus: 'shocked', bonusDamage: 10, aoeRadius: 6, consumesPrimary: true, propagatesStatus: { statusType: 'burning', radius: 5 }, enabled: true },
    ] });
    const a = makeEnemy('p1'); a.x = 0; a.z = 0;
    const near = makeEnemy('p2'); near.x = 3; near.z = 0;
    const far = makeEnemy('p3'); far.x = 20; far.z = 0;
    for (const t of [a, near, far]) useCombatTargetStore.getState().spawn(t);
    applyStatusEffect('p1', 'burning', 'test');
    tryTriggerReaction('p1', 'shocked', 'test', recordingDeps());
    expect(getTargetStatusEffects('p2').some((s) => s.type === 'burning')).toBe(true); // spread to near
    expect(getTargetStatusEffects('p3').some((s) => s.type === 'burning')).toBe(false); // far untouched
  });

  // Wave 5 — bleed reactions.
  it('bloodburst splashes AoE + consumes bleed when a bleeding enemy is set burning', () => {
    const e = makeEnemy('b1');
    useCombatTargetStore.getState().spawn(e);
    applyStatusEffect('b1', 'bleed', 'test');
    const deps = recordingDeps();
    expect(tryTriggerReaction('b1', 'burning', 'test', deps)).toBe('bloodburst');
    expect(deps.aoe.length).toBe(1); // aoeRadius 5
    expect(getTargetStatusEffects('b1').some((s) => s.type === 'bleed')).toBe(false); // consumed
  });

  it('rupture deals a big single burst when a bleeding enemy is armor-broken', () => {
    const e = makeEnemy('b2');
    useCombatTargetStore.getState().spawn(e);
    applyStatusEffect('b2', 'bleed', 'test');
    const deps = recordingDeps();
    expect(tryTriggerReaction('b2', 'armor-broken', 'test', deps)).toBe('rupture');
    expect(deps.single).toEqual([48]);
  });
});
