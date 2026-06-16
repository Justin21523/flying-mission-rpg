import { describe, it, expect, beforeEach } from 'vitest';
import { recordIncidentResolved, recordIncidentObjectiveComplete, recordIncidentFailed } from '../../game/incidents/IncidentZoneAdapter';
import { useAdvancedMissionZoneStore } from '../../stores/game/useAdvancedMissionZoneStore';
import { evaluateCondition, type ZoneWorldProbe } from '../../game/advanced-mission-zone/ZoneCompletionEvaluator';
import type { ZoneSegmentDefinition } from '../../types/game/advancedMissionZone';

const seg = { markers: [] } as unknown as ZoneSegmentDefinition;
function probe(): ZoneWorldProbe {
  const z = useAdvancedMissionZoneStore.getState();
  return {
    playerPos: { x: 0, z: 0 }, nowMs: 0, segmentStartedAtMs: 0,
    completedObjectiveIds: new Set(), interactedObjectIds: new Set(), clearedAreaIds: new Set(), completedSegmentIds: new Set(), godMode: false,
    resolvedIncidentIds: new Set(z.resolvedIncidentIds),
    completedIncidentObjectiveIds: new Set(z.completedIncidentObjectiveIds),
    failedIncidentIds: new Set(z.failedIncidentIds),
  };
}

describe('IncidentZoneAdapter → zone conditions (Batch G)', () => {
  beforeEach(() => useAdvancedMissionZoneStore.getState().resetZone());

  it('resolve-incident zone condition completes after an incident succeeds', () => {
    const cond = { id: 'c1', type: 'resolve-incident', incidentId: 'inc_x' } as const;
    expect(evaluateCondition(cond, seg, probe()).done).toBe(false);
    recordIncidentResolved('inc_x');
    expect(evaluateCondition(cond, seg, probe()).done).toBe(true);
  });

  it('incident-success + complete-incident-objective + incident-failed all wire through', () => {
    recordIncidentResolved('inc_y');
    recordIncidentObjectiveComplete('inc_y', 'obj_1');
    recordIncidentFailed('inc_z');
    expect(evaluateCondition({ id: 's', type: 'incident-success', incidentId: 'inc_y' }, seg, probe()).done).toBe(true);
    expect(evaluateCondition({ id: 'o', type: 'complete-incident-objective', incidentId: 'inc_y', objectiveStepId: 'obj_1' }, seg, probe()).done).toBe(true);
    expect(evaluateCondition({ id: 'f', type: 'incident-failed', incidentId: 'inc_z' }, seg, probe()).done).toBe(true);
  });
});
