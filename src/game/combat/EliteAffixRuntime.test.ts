import { describe, it, expect, beforeEach } from 'vitest';
import { rollAffixes, applyAffixesToTarget, affixRegenedHp, berserkMoveSpeed, vampiricHeal } from './EliteAffixRuntime';
import { useEliteAffixStore } from '../../stores/game/useEliteAffixStore';
import { SEED_ELITE_AFFIXES, type AffixPolicy } from '../../data/combat/eliteAffixes';
import type { CombatTarget } from '../../stores/game/combatTargetStore';

function makeEnemy(): CombatTarget {
  return {
    id: 't1', definitionId: 'crusher_drone', hp: 100, maxHp: 100, shield: 0, maxShield: 0,
    x: 0, y: 0, z: 0, defeatedAt: 0, isEnemy: true, moveSpeed: 3, scale: 1, aiData: {},
  };
}

const policy: AffixPolicy = { allowedAffixIds: ['shielded', 'volatile', 'swift', 'regenerating', 'vampiric'], chancePerEnemy: 0.5, maxPerEnemy: 2 };

beforeEach(() => {
  useEliteAffixStore.getState().importState({ items: SEED_ELITE_AFFIXES });
});

describe('rollAffixes', () => {
  it('returns nothing when the chance roll fails', () => {
    expect(rollAffixes(policy, () => 0.9)).toEqual([]); // 0.9 >= 0.5
  });
  it('returns nothing for an empty / disabled policy', () => {
    expect(rollAffixes(undefined, () => 0)).toEqual([]);
    expect(rollAffixes({ ...policy, maxPerEnemy: 0 }, () => 0)).toEqual([]);
  });
  it('picks up to maxPerEnemy distinct affixes when the chance roll passes', () => {
    const got = rollAffixes(policy, () => 0); // 0 < 0.5 → roll; idx 0 each time
    expect(got.length).toBe(2);
    expect(new Set(got).size).toBe(2); // distinct (spliced out of the pool)
  });
});

describe('applyAffixesToTarget', () => {
  it('shielded adds shield + scales hp and enlarges the silhouette', () => {
    const t = makeEnemy();
    applyAffixesToTarget(t, ['shielded']);
    expect(t.maxShield).toBe(52); // shieldFraction 0.45 × boosted maxHp 115 = 51.75 → 52
    expect(t.shield).toBe(52);
    expect(t.maxHp).toBe(115); // 100 * 1.15
    expect(t.hp).toBe(115);
    expect(t.scale).toBeCloseTo(1.2);
    expect(t.affixIds).toEqual(['shielded']);
  });

  it('swift multiplies move speed', () => {
    const t = makeEnemy();
    applyAffixesToTarget(t, ['swift']);
    expect(t.moveSpeed).toBeCloseTo(4.05); // 3 * 1.35
  });

  it('volatile stashes explosion config on the ai blackboard', () => {
    const t = makeEnemy();
    applyAffixesToTarget(t, ['volatile']);
    expect(t.aiData?.affixVolatileRadius).toBe(6);
    expect(t.aiData?.affixVolatileDamage).toBe(35);
  });

  it('regenerating + vampiric stash per-frame values', () => {
    const t = makeEnemy();
    applyAffixesToTarget(t, ['regenerating', 'vampiric']);
    expect(t.aiData?.affixRegenPerSec).toBe(6);
    expect(t.aiData?.affixLifesteal).toBe(0.5);
  });

  it('skips disabled affixes', () => {
    useEliteAffixStore.getState().update('shielded', { enabled: false });
    const t = makeEnemy();
    const applied = applyAffixesToTarget(t, ['shielded']);
    expect(applied).toEqual([]);
    expect(t.maxShield).toBe(0);
  });

  it('Wave 5 — berserk stashes threshold + speed mult; summoner stashes count + enemy id', () => {
    const t = makeEnemy();
    applyAffixesToTarget(t, ['berserk', 'summoner']);
    expect(t.aiData?.affixBerserkThreshold).toBe(0.4);
    expect(t.aiData?.affixBerserkSpeedMult).toBe(1.6);
    expect(t.aiData?.affixSummonCount).toBe(2);
    expect(t.affixSummonEnemyId).toBe('zip_glitch');
  });
});

describe('Wave 5 affix tick helpers', () => {
  it('affixRegenedHp heals by perSec*dt and clamps to maxHp', () => {
    expect(affixRegenedHp(50, 100, 6, 0.5)).toBeCloseTo(53); // +3
    expect(affixRegenedHp(99, 100, 6, 1)).toBe(100); // clamped
  });
  it('berserkMoveSpeed frenzies only below the HP threshold', () => {
    expect(berserkMoveSpeed(3, 30, 100, 0.4, 1.6)).toBeCloseTo(4.8); // 30% < 40% → ×1.6
    expect(berserkMoveSpeed(3, 60, 100, 0.4, 1.6)).toBe(3); // 60% ≥ 40% → base
  });

  it('vampiricHeal heals by lifesteal fraction (clamped), no-op without the affix', () => {
    const t = makeEnemy(); t.hp = 50; t.maxHp = 100; t.aiData = { affixLifesteal: 0.5 };
    vampiricHeal(t, 10);
    expect(t.hp).toBe(55); // 50 + 10*0.5
    t.hp = 99; vampiricHeal(t, 10);
    expect(t.hp).toBe(100); // clamped to maxHp
    const plain = makeEnemy(); plain.hp = 50; plain.aiData = {};
    vampiricHeal(plain, 10);
    expect(plain.hp).toBe(50); // no affix → unchanged
  });
});
