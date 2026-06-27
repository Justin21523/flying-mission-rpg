import { describe, expect, it } from 'vitest';
import { classifyDamageFeedback, makeUtilityFeedback } from './CombatFeedbackClassifier';
import type { DamageResult } from '../../types/game/combat';

const result = (patch: Partial<DamageResult> = {}): DamageResult => ({
  targetId: 'target_1',
  originalAmount: 20,
  finalAmount: 20,
  shieldDamage: 0,
  hpDamage: 20,
  wasWeaknessHit: false,
  wasResisted: false,
  wasImmune: false,
  wasCrit: false,
  shieldBroken: false,
  targetDefeated: false,
  appliedTags: ['impact'],
  ...patch,
});

describe('CombatFeedbackClassifier', () => {
  it('classifies normal hit, weakness hit, shield break, and defeated target', () => {
    expect(classifyDamageFeedback({ result: result() })?.kind).toBe('basic-hit');
    expect(classifyDamageFeedback({ result: result({ wasWeaknessHit: true, appliedTags: ['precision'] }) })?.kind).toBe('weakpoint-hit');
    expect(classifyDamageFeedback({ result: result({ shieldDamage: 30, shieldBroken: true }) })?.kind).toBe('shield-break');
    expect(classifyDamageFeedback({ result: result({ targetDefeated: true }) })?.kind).toBe('target-defeated');
  });

  it('prioritizes immunity and boss weakpoint hits', () => {
    expect(classifyDamageFeedback({ result: result({ wasImmune: true, finalAmount: 0, hpDamage: 0 }) })?.kind).toBe('immune');
    const boss = classifyDamageFeedback({ result: result({ wasWeaknessHit: true }), target: { id: 'wp', definitionId: 'd', hp: 10, maxHp: 10, shield: 0, maxShield: 0, x: 0, y: 0, z: 0, defeatedAt: 0, isBossWeakpoint: true } });
    expect(boss?.label).toBe('Boss Weakpoint Hit');
    expect(boss?.tier).toBe('cinematic');
  });

  it('creates readable utility feedback', () => {
    expect(makeUtilityFeedback('scan-exposed', 'e1', 'scan').label).toBe('Weakpoint Exposed');
    expect(makeUtilityFeedback('boss-weakpoint-exposed', 'wp1', 'scan').tier).toBe('cinematic');
  });
});
