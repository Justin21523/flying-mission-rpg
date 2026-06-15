import { describe, it, expect } from 'vitest';
import { resolveTargets, targetTags } from '../../game/support-combat/SupportTargetingResolver';
import type { CombatTarget } from '../../stores/game/combatTargetStore';
import type { SupportTargetingDefinition } from '../../types/game/supportCombat';

const enemy = (id: string, x: number, z: number, over: Partial<CombatTarget> = {}): CombatTarget => ({
  id, definitionId: 'd', hp: 50, maxHp: 50, shield: 0, maxShield: 0, x, y: 0, z, defeatedAt: 0, isEnemy: true, ...over,
});
const obstacle = (id: string, x: number, z: number, over: Partial<CombatTarget> = {}): CombatTarget => ({
  id, definitionId: 'd', hp: 50, maxHp: 50, shield: 0, maxShield: 0, x, y: 0, z, defeatedAt: 0, isObstacle: true, obstacleId: id, ...over,
});

const ctx = (candidates: CombatTarget[], over = {}) => ({ playerX: 0, playerZ: 0, headingRad: 0, candidates, ...over });

describe('SupportTargetingResolver', () => {
  it('picks the nearest enemy', () => {
    const t: SupportTargetingDefinition = { targetType: 'enemy', rangeShape: 'single', maxRange: 30, targetPriority: 'nearest' };
    const r = resolveTargets(t, ctx([enemy('far', 10, 0), enemy('near', 2, 0)]));
    expect(r.primaryId).toBe('near');
  });

  it('prioritises a shielded enemy', () => {
    const t: SupportTargetingDefinition = { targetType: 'enemy', rangeShape: 'single', maxRange: 30, targetPriority: 'shielded' };
    const r = resolveTargets(t, ctx([enemy('plain', 2, 0), enemy('shielded', 6, 0, { shield: 40, maxShield: 40 })]));
    expect(r.primaryId).toBe('shielded');
  });

  it('targets a repairable device (obstacle)', () => {
    const t: SupportTargetingDefinition = { targetType: 'device', rangeShape: 'single', maxRange: 20, targetPriority: 'objective-linked' };
    const r = resolveTargets(t, ctx([enemy('e', 3, 0), obstacle('corrupted_device_01', 5, 0)]));
    expect(r.primaryId).toBe('corrupted_device_01');
  });

  it('rejects targets failing validTargetTags', () => {
    const t: SupportTargetingDefinition = { targetType: 'enemy', rangeShape: 'single', maxRange: 30 };
    const r = resolveTargets(t, ctx([enemy('e', 2, 0)], { validTargetTags: ['obstacle'] }));
    expect(r.primaryId).toBeUndefined();
  });

  it('collects a group within radius for enemy-group', () => {
    const t: SupportTargetingDefinition = { targetType: 'enemy-group', rangeShape: 'sphere', maxRange: 30, radius: 6 };
    const r = resolveTargets(t, ctx([enemy('a', 1, 0), enemy('b', 3, 0), enemy('faraway', 25, 0)]));
    expect(r.targetIds.sort()).toEqual(['a', 'b']);
  });

  it('derives coarse tags', () => {
    expect(targetTags(enemy('e', 0, 0, { archetype: 'crusher-drone', scanned: true }))).toEqual(expect.arrayContaining(['enemy', 'crusher-drone', 'scanned']));
    expect(targetTags(obstacle('o', 0, 0))).toEqual(expect.arrayContaining(['obstacle', 'device']));
  });
});
