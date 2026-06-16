import { describe, it, expect, beforeEach } from 'vitest';
import { applyOneChange } from '../../game/incidents/IncidentApplicationController';
import { evaluateIncidentCondition } from '../../game/incidents/IncidentCompletionEvaluator';
import { useIncidentNpcStateStore } from '../../stores/useIncidentNpcStateStore';
import { useIncidentObjectStateStore } from '../../stores/useIncidentObjectStateStore';
import { useIncidentRuntimeStore } from '../../stores/useIncidentRuntimeStore';
import type { IncidentPlan } from '../../types/aiIncidentTypes';

const PLAN = { affectedArea: { areaId: 'incident_area_main', center: [0, 0, 0], radius: 10 } } as unknown as IncidentPlan;

describe('IncidentCompletionEvaluator (Batch G)', () => {
  beforeEach(() => {
    useIncidentNpcStateStore.getState().clearAll();
    useIncidentObjectStateStore.getState().clearAll();
    useIncidentRuntimeStore.getState().reset();
  });

  it('detects a rescued npc (npc-state safe)', () => {
    applyOneChange({ id: 'a', targetType: 'npc', targetId: 'incident_npc_0', change: 'set-safe' }, [0, 0, 0]);
    expect(evaluateIncidentCondition({ type: 'npc-state', npcId: 'incident_npc_0', state: 'safe' }, PLAN, 0, 0)).toBe(true);
    expect(evaluateIncidentCondition({ type: 'npc-state', npcId: 'incident_npc_0', state: 'trapped' }, PLAN, 0, 0)).toBe(false);
  });

  it('detects a repaired (virtual) device', () => {
    applyOneChange({ id: 'b', targetType: 'obstacle', targetId: 'incident_device_0', change: 'repair' }, [0, 0, 0]);
    expect(evaluateIncidentCondition({ type: 'device-repaired', deviceId: 'incident_device_0' }, PLAN, 0, 0)).toBe(true);
  });

  it('detects a cleared (virtual) obstacle', () => {
    applyOneChange({ id: 'c', targetType: 'obstacle', targetId: 'incident_obstacle_0', change: 'clear' }, [0, 0, 0]);
    expect(evaluateIncidentCondition({ type: 'obstacle-state', obstacleId: 'incident_obstacle_0', state: 'cleared' }, PLAN, 0, 0)).toBe(true);
  });

  it('fires a timer-expired condition once the limit passes', () => {
    expect(evaluateIncidentCondition({ type: 'timer-expired', seconds: 10 }, PLAN, 5000, 0)).toBe(false);
    expect(evaluateIncidentCondition({ type: 'timer-expired', seconds: 10 }, PLAN, 11000, 0)).toBe(true);
  });
});
