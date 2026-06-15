import { describe, it, expect } from 'vitest';
import { recordSupportOutcome } from '../../game/support-combat/SupportZoneConditionAdapter';
import { evaluateCondition, type ZoneWorldProbe } from '../../game/advanced-mission-zone/ZoneCompletionEvaluator';
import type { ZoneSegmentDefinition, ZoneConditionDefinition } from '../../types/game/advancedMissionZone';

const seg = { id: 's', markers: [], completionConditions: [] } as unknown as ZoneSegmentDefinition;
const probe = (over: Partial<ZoneWorldProbe> = {}): ZoneWorldProbe => ({
  playerPos: { x: 0, z: 0 }, nowMs: 1000, segmentStartedAtMs: 0,
  completedObjectiveIds: new Set(), interactedObjectIds: new Set(), clearedAreaIds: new Set(), completedSegmentIds: new Set(),
  godMode: false, ...over,
});

describe('SupportZoneConditionAdapter', () => {
  it('records each zone-relevant event from a support outcome', () => {
    const events: { kind: string; id: string }[] = [];
    recordSupportOutcome(
      { abilityId: 'support_repair_donnie', primaryTargetId: 'corrupted_device_01', repairedDeviceIds: ['corrupted_device_01'], clearedObstacleIds: [], scannedTargetIds: [] },
      (kind, id) => events.push({ kind, id }),
    );
    expect(events).toContainEqual({ kind: 'use-support-ability', id: 'support_repair_donnie' });
    expect(events).toContainEqual({ kind: 'support-repair-device', id: 'corrupted_device_01' });
  });

  it('completes support-repair-device / support-clear-obstacle / support-scan-target', () => {
    const cRepair: ZoneConditionDefinition = { id: 'c1', type: 'support-repair-device', deviceId: 'corrupted_device_01' };
    const cClear: ZoneConditionDefinition = { id: 'c2', type: 'support-clear-obstacle', obstacleId: 'energy_barrier_01' };
    const cScan: ZoneConditionDefinition = { id: 'c3', type: 'support-scan-target', targetId: 'shield_carrier_1' };
    expect(evaluateCondition(cRepair, seg, probe({ supportRepairedDeviceIds: new Set(['corrupted_device_01']) })).done).toBe(true);
    expect(evaluateCondition(cClear, seg, probe({ supportClearedObstacleIds: new Set(['energy_barrier_01']) })).done).toBe(true);
    expect(evaluateCondition(cScan, seg, probe({ supportScannedTargetIds: new Set(['shield_carrier_1']) })).done).toBe(true);
    expect(evaluateCondition(cScan, seg, probe()).done).toBe(false);
  });

  it('completes use-support-ability (with + without targetId)', () => {
    const cAny: ZoneConditionDefinition = { id: 'c4', type: 'use-support-ability', abilityId: 'support_strike_jett' };
    const cTgt: ZoneConditionDefinition = { id: 'c5', type: 'use-support-ability', abilityId: 'support_strike_jett', targetId: 'e1' };
    expect(evaluateCondition(cAny, seg, probe({ usedSupportAbilityIds: new Set(['support_strike_jett']) })).done).toBe(true);
    expect(evaluateCondition(cTgt, seg, probe({ usedSupportAbilityIds: new Set(['support_strike_jett:e1']) })).done).toBe(true);
  });

  it('tracks support-protect-area accrued seconds', () => {
    const c: ZoneConditionDefinition = { id: 'c6', type: 'support-protect-area', areaId: 'support_protect', seconds: 3 };
    expect(evaluateCondition(c, seg, probe({ protectedAreaSeconds: { support_protect: 1.5 } })).done).toBe(false);
    expect(evaluateCondition(c, seg, probe({ protectedAreaSeconds: { support_protect: 3.2 } })).done).toBe(true);
  });
});
