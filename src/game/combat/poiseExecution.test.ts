import { describe, it, expect, beforeEach } from 'vitest';
import { damageTargetByTemplate, castExecutionFinisher, executableTargetNear } from './CombatDirector';
import { spawnEnemyFromDef } from './enemyRuntime';
import { useEditorEnemyStore, getEnemyDef } from '../../stores/game/editorCombatStore';
import { useCombatTargetStore } from '../../stores/game/combatTargetStore';
import { SEED_ENEMIES } from '../../data/combat/enemyDefinitions';
import { makeUtilityFeedback } from './CombatFeedbackClassifier';

const hit = (staggerValue: number) => ({ amount: 4, damageType: 'impact' as const, attackTags: ['melee'], staggerValue });

beforeEach(() => {
  useEditorEnemyStore.getState().importState({ items: SEED_ENEMIES });
  useCombatTargetStore.getState().reset();
});

describe('poise / break', () => {
  it('accumulates poise from staggering hits and breaks into a stun', () => {
    const t = spawnEnemyFromDef(getEnemyDef('dart_dodger')!, 0, 0); // poise max 40
    expect(t.maxPoise).toBe(40);
    damageTargetByTemplate(t.id, hit(20));
    expect(t.poiseValue).toBe(20);
    damageTargetByTemplate(t.id, hit(30)); // 50 >= 40 → break
    expect(t.poiseValue).toBe(0);
    expect(t.aiData?.stunUntil ?? 0).toBeGreaterThan(0);
  });

  it('does not accrue poise on enemies without a poise meter', () => {
    const t = spawnEnemyFromDef(getEnemyDef('volatile_bomber')!, 0, 0); // no poise config
    expect(t.maxPoise).toBeUndefined();
    damageTargetByTemplate(t.id, hit(50));
    expect(t.poiseValue ?? 0).toBe(0);
  });
});

describe('execution finisher', () => {
  it('finishes a live enemy and marks it defeated', () => {
    const t = spawnEnemyFromDef(getEnemyDef('dart_dodger')!, 0, 0);
    t.hp = 5;
    expect(castExecutionFinisher(t.id)).toBe(true);
    expect(t.hp).toBe(0);
    expect(t.defeatedAt).toBeGreaterThan(0);
    // a second execution on the same target is a no-op
    expect(castExecutionFinisher(t.id)).toBe(false);
  });

  it('executableTargetNear selects the nearest low-HP enemy and skips healthy ones', () => {
    const healthy = spawnEnemyFromDef(getEnemyDef('dart_dodger')!, 0, 0);
    healthy.hp = healthy.maxHp; // full HP → not executable
    const weak = spawnEnemyFromDef(getEnemyDef('dart_dodger')!, 2, 0);
    weak.hp = weak.maxHp * 0.1; // 10% → executable
    expect(executableTargetNear(0, 0)?.id).toBe(weak.id);
  });

  it('ignores enemies out of range', () => {
    const far = spawnEnemyFromDef(getEnemyDef('dart_dodger')!, 100, 0);
    far.hp = 2;
    expect(executableTargetNear(0, 0)).toBeUndefined();
  });
});

describe('feedback kinds', () => {
  it('builds poise-break and execution feedback', () => {
    expect(makeUtilityFeedback('poise-break', 't', undefined).kind).toBe('poise-break');
    expect(makeUtilityFeedback('poise-break', 't', undefined).tier).toBe('strong');
    expect(makeUtilityFeedback('execution', 't', undefined).kind).toBe('execution');
    expect(makeUtilityFeedback('execution', 't', undefined).tier).toBe('cinematic');
  });
});
