import { describe, it, expect } from 'vitest';
import { evaluateCondition, type ZoneWorldProbe } from './ZoneCompletionEvaluator';
import type { ZoneSegmentDefinition, ZoneConditionDefinition } from '../../types/game/advancedMissionZone';

const seg: ZoneSegmentDefinition = {
  id: 's', zoneId: 'z', name: 's', order: 1, segmentType: 'combat-placeholder',
  entryConditions: [], completionConditions: [], nextSegmentIds: [], markers: [], enabled: true,
};

const probe = (over: Partial<ZoneWorldProbe> = {}): ZoneWorldProbe => ({
  playerPos: { x: 0, z: 0 }, nowMs: 0, segmentStartedAtMs: 0,
  completedObjectiveIds: new Set(), interactedObjectIds: new Set(), clearedAreaIds: new Set(), completedSegmentIds: new Set(),
  godMode: false, ...over,
});

describe('Batch C zone conditions', () => {
  it('defeat-enemy-group completes when the group is cleared (with count progress)', () => {
    const c: ZoneConditionDefinition = { id: 'c', type: 'defeat-enemy-group', enemyGroupId: 'g1' };
    const inProgress = evaluateCondition(c, seg, probe({ enemyGroupRemaining: { g1: { remaining: 2, total: 5 } } }));
    expect(inProgress.done).toBe(false);
    expect(inProgress.current).toBe(3);
    expect(inProgress.total).toBe(5);
    expect(evaluateCondition(c, seg, probe({ clearedEnemyGroupIds: new Set(['g1']), enemyGroupRemaining: { g1: { remaining: 0, total: 5 } } })).done).toBe(true);
  });

  it('destroy-obstacle completes when the obstacle is destroyed', () => {
    const c: ZoneConditionDefinition = { id: 'c', type: 'destroy-obstacle', obstacleId: 'w1' };
    expect(evaluateCondition(c, seg, probe()).done).toBe(false);
    expect(evaluateCondition(c, seg, probe({ destroyedObstacleIds: new Set(['w1']) })).done).toBe(true);
  });

  it('clear-obstacle completes when the obstacle is cleared', () => {
    const c: ZoneConditionDefinition = { id: 'c', type: 'clear-obstacle', obstacleId: 'b1' };
    expect(evaluateCondition(c, seg, probe({ clearedObstacleIds: new Set(['b1']) })).done).toBe(true);
  });

  it('repair-device completes when the device is repaired', () => {
    const c: ZoneConditionDefinition = { id: 'c', type: 'repair-device', deviceId: 'd1' };
    expect(evaluateCondition(c, seg, probe({ repairedDeviceIds: new Set(['d1']) })).done).toBe(true);
  });

  it('future-* aliases resolve the same way', () => {
    const c: ZoneConditionDefinition = { id: 'c', type: 'future-destroy-obstacle', obstacleId: 'w1' };
    expect(evaluateCondition(c, seg, probe({ destroyedObstacleIds: new Set(['w1']) })).done).toBe(true);
  });
});
