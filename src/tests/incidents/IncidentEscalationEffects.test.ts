import { describe, it, expect, beforeEach } from 'vitest';
import { tickEscalation, resetEscalation, recomputeDanger, isCollapsed } from '../../game/incidents/IncidentEscalationController';
import { useIncidentRuntimeStore } from '../../stores/useIncidentRuntimeStore';
import { useIncidentNpcStateStore, getIncidentNpcState } from '../../stores/useIncidentNpcStateStore';
import { useIncidentHazardStore } from '../../stores/useIncidentHazardStore';
import type { IncidentPlan } from '../../types/aiIncidentTypes';

function plan(opts: { danger?: number; maxLevel?: number; effects?: IncidentPlan['escalationEffects']; objectives?: { id: string; optional: boolean }[] }): IncidentPlan {
  return {
    incidentId: 'inc_e', affectedArea: { areaId: 'incident_area_main', center: [0, 0, 0], radius: 8 },
    dangerLevel: opts.danger ?? 2,
    objectiveSteps: (opts.objectives ?? []).map((o) => ({ ...o, completionConditions: [] })),
    escalationEffects: opts.effects,
    aiControlParameters: { allowEscalation: true, escalationIntervalSeconds: 10, maxEscalationLevel: opts.maxLevel ?? 3, allowNPCStateChanges: true, allowObjectStateChanges: true, allowEnvironmentStateChanges: true },
  } as unknown as IncidentPlan;
}

describe('Dynamic escalation effects (Batch H)', () => {
  beforeEach(() => { useIncidentRuntimeStore.getState().reset(); useIncidentNpcStateStore.getState().clearAll(); useIncidentHazardStore.getState().clearAll(); resetEscalation(0); });

  it('applies the per-level escalation effects (worse NPC + hazard)', () => {
    const p = plan({ effects: [[{ id: 'e1', targetType: 'npc', targetId: 'incident_npc_0', change: 'set-injured' }, { id: 'e2', targetType: 'environment', targetId: 'incident_area_main', change: 'spawn-fire-placeholder' }]] });
    useIncidentNpcStateStore.getState().setNpc('incident_npc_0', { state: 'waiting-rescue', position: [0, 0, 0] });
    expect(tickEscalation(p, 10_001)).toBe(true);
    expect(getIncidentNpcState('incident_npc_0')).toBe('injured');
    expect(Object.values(useIncidentHazardStore.getState().hazards).some((h) => h.kind === 'fire' && h.active)).toBe(true);
  });

  it('de-escalation eases danger as non-optional objectives are resolved', () => {
    const p = plan({ danger: 4, objectives: [{ id: 'o1', optional: false }, { id: 'o2', optional: false }] });
    useIncidentRuntimeStore.getState().patch({ dangerLevel: 4 });
    useIncidentRuntimeStore.getState().addCompletedObjective('o1');
    useIncidentRuntimeStore.getState().addCompletedObjective('o2');
    recomputeDanger(p);
    expect(useIncidentRuntimeStore.getState().runtime.dangerLevel).toBe(2); // clamp(4 + 0 - 2)
  });

  it('collapses after sitting at max escalation past the window', () => {
    const p = plan({ maxLevel: 1 });
    expect(tickEscalation(p, 10_001)).toBe(true); // reaches level 1 (== max) at t=10001
    expect(isCollapsed(p, 12_000)).toBe(false); // within window
    useIncidentRuntimeStore.getState().setStatus('active');
    expect(isCollapsed(p, 19_000)).toBe(true); // > 8s after maxLevelAtMs
  });
});
