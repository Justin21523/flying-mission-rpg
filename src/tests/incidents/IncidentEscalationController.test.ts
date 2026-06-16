import { describe, it, expect, beforeEach } from 'vitest';
import { tickEscalation, resetEscalation } from '../../game/incidents/IncidentEscalationController';
import { useIncidentRuntimeStore } from '../../stores/useIncidentRuntimeStore';
import type { IncidentPlan } from '../../types/aiIncidentTypes';

const planWith = (allow: boolean): IncidentPlan => ({
  affectedArea: { areaId: 'incident_area_main', center: [0, 0, 0], radius: 8 },
  dangerLevel: 1, objectiveSteps: [],
  aiControlParameters: { allowEscalation: allow, escalationIntervalSeconds: 10, maxEscalationLevel: 3, allowNPCStateChanges: true, allowObjectStateChanges: true, allowEnvironmentStateChanges: true },
} as unknown as IncidentPlan);

describe('IncidentEscalationController (Batch G)', () => {
  beforeEach(() => { useIncidentRuntimeStore.getState().reset(); resetEscalation(0); });

  it('raises dangerLevel after the interval elapses', () => {
    const plan = planWith(true);
    useIncidentRuntimeStore.getState().patch({ dangerLevel: 1 });
    expect(tickEscalation(plan, 5_000)).toBe(false); // before interval
    expect(tickEscalation(plan, 10_001)).toBe(true); // after interval
    expect(useIncidentRuntimeStore.getState().runtime.dangerLevel).toBe(2);
    expect(useIncidentRuntimeStore.getState().runtime.currentEscalationLevel).toBe(1);
  });

  it('freeze blocks escalation', () => {
    const plan = planWith(true);
    useIncidentRuntimeStore.getState().setDebug({ freezeEscalation: true });
    expect(tickEscalation(plan, 20_000)).toBe(false);
  });

  it('does not escalate when not allowed', () => {
    expect(tickEscalation(planWith(false), 20_000)).toBe(false);
  });
});
