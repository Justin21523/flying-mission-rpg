import { describe, it, expect } from 'vitest';
import { evaluateCondition, evaluateSegmentCompletion } from './ZoneCompletionEvaluator';
import type { ZoneWorldProbe } from './ZoneCompletionEvaluator';
import type { ZoneSegmentDefinition } from '../../types/game/advancedMissionZone';

const baseProbe = (patch: Partial<ZoneWorldProbe> = {}): ZoneWorldProbe => ({
  playerPos: { x: 0, z: 0 },
  nowMs: 10_000,
  segmentStartedAtMs: 0,
  completedObjectiveIds: new Set(),
  interactedObjectIds: new Set(),
  clearedAreaIds: new Set(),
  completedSegmentIds: new Set(),
  godMode: false,
  ...patch,
});

const segWith = (markers: ZoneSegmentDefinition['markers']): ZoneSegmentDefinition => ({
  id: 's',
  zoneId: 'z',
  name: 's',
  order: 1,
  segmentType: 'exploration',
  entryConditions: [],
  completionConditions: [],
  nextSegmentIds: [],
  markers,
  enabled: true,
});

describe('evaluateCondition', () => {
  const seg = segWith([{ id: 'm1', type: 'objective', position: [10, 0, 0], radius: 4 }]);

  it('reach-marker is done within radius, not outside', () => {
    expect(evaluateCondition({ id: 'c', type: 'reach-marker', markerId: 'm1', radius: 4 }, seg, baseProbe({ playerPos: { x: 12, z: 0 } })).done).toBe(true);
    expect(evaluateCondition({ id: 'c', type: 'reach-marker', markerId: 'm1', radius: 4 }, seg, baseProbe({ playerPos: { x: 20, z: 0 } })).done).toBe(false);
  });

  it('interact-with-object reflects recorded interactions', () => {
    expect(evaluateCondition({ id: 'c', type: 'interact-with-object', objectId: 'sw' }, seg, baseProbe({ interactedObjectIds: new Set(['sw']) })).done).toBe(true);
    expect(evaluateCondition({ id: 'c', type: 'interact-with-object', objectId: 'sw' }, seg, baseProbe()).done).toBe(false);
  });

  it('complete-existing-objective reads the objective set', () => {
    expect(evaluateCondition({ id: 'c', type: 'complete-existing-objective', objectiveId: 'obj_fix_beacon' }, seg, baseProbe({ completedObjectiveIds: new Set(['obj_fix_beacon']) })).done).toBe(true);
  });

  it('placeholder-clear-area reads the cleared set', () => {
    expect(evaluateCondition({ id: 'c', type: 'placeholder-clear-area', areaId: 'yard' }, seg, baseProbe({ clearedAreaIds: new Set(['yard']) })).done).toBe(true);
  });

  it('wait-seconds completes after the elapsed time', () => {
    expect(evaluateCondition({ id: 'c', type: 'wait-seconds', seconds: 5 }, seg, baseProbe({ nowMs: 6_000, segmentStartedAtMs: 0 })).done).toBe(true);
    expect(evaluateCondition({ id: 'c', type: 'wait-seconds', seconds: 5 }, seg, baseProbe({ nowMs: 2_000, segmentStartedAtMs: 0 })).done).toBe(false);
  });

  it('debug-complete never completes without god mode', () => {
    expect(evaluateCondition({ id: 'c', type: 'debug-complete' }, seg, baseProbe()).done).toBe(false);
    expect(evaluateCondition({ id: 'c', type: 'debug-complete' }, seg, baseProbe({ godMode: true })).done).toBe(true);
  });

  it('future-* conditions are not satisfiable without god mode', () => {
    expect(evaluateCondition({ id: 'c', type: 'future-defeat-boss', bossId: 'b' }, seg, baseProbe()).done).toBe(false);
    expect(evaluateCondition({ id: 'c', type: 'future-defeat-boss', bossId: 'b' }, seg, baseProbe({ godMode: true })).done).toBe(true);
  });
});

describe('evaluateSegmentCompletion', () => {
  it('requires every completion condition (AND)', () => {
    const seg: ZoneSegmentDefinition = {
      ...segWith([{ id: 'm1', type: 'objective', position: [0, 0, 0], radius: 4 }]),
      completionConditions: [
        { id: 'reach', type: 'reach-marker', markerId: 'm1', radius: 4 },
        { id: 'use', type: 'interact-with-object', objectId: 'sw' },
      ],
    };
    expect(evaluateSegmentCompletion(seg, baseProbe()).complete).toBe(false);
    expect(evaluateSegmentCompletion(seg, baseProbe({ interactedObjectIds: new Set(['sw']) })).complete).toBe(true);
  });

  it('a segment with no completion conditions is not auto-complete', () => {
    expect(evaluateSegmentCompletion(segWith([]), baseProbe()).complete).toBe(false);
  });
});
