import { describe, it, expect, beforeEach } from 'vitest';
import { readIncidentWorldState } from '../../game/incidents/IncidentWorldStateReader';
import { generateMockPlan } from '../../game/incidents/AIIncidentMockProvider';
import { applyIncidentPlan, update, cleanup } from '../../game/incidents/AIIncidentDirector';
import { applyOneChange } from '../../game/incidents/IncidentApplicationController';
import { useIncidentNpcStateStore } from '../../stores/useIncidentNpcStateStore';
import { useIncidentRuntimeStore } from '../../stores/useIncidentRuntimeStore';
import { useAdvancedMissionZoneStore } from '../../stores/game/useAdvancedMissionZoneStore';
import { robotHandle } from '../../game/destination/robotHandle';

describe('AIIncidentDirector end-to-end (Batch G)', () => {
  beforeEach(() => { cleanup(); useAdvancedMissionZoneStore.getState().resetZone(); });

  it('refuses to apply an invalid plan — the world is untouched', () => {
    const world = readIncidentWorldState();
    const plan = generateMockPlan(world, { templateId: 'tmpl_road_accident', incidentId: 'inc_bad' });
    const ok = applyIncidentPlan({ ...plan, involvedNPCIds: ['ghost_npc'] });
    expect(ok).toBe(false);
    expect(Object.keys(useIncidentNpcStateStore.getState().npcs).length).toBe(0);
    expect(useIncidentRuntimeStore.getState().runtime.status).toBe('validation-failed');
  });

  it('resolves an incident through play → zone resolve-incident completes', () => {
    const world = readIncidentWorldState();
    const plan = generateMockPlan(world, { templateId: 'tmpl_road_accident', incidentId: 'incident_seg_cargo_street' });
    expect(applyIncidentPlan(plan)).toBe(true);
    expect(useIncidentRuntimeStore.getState().runtime.status).toBe('active');

    // Player clears the blockage + reaches the scene (rescue happens on reach).
    applyOneChange({ id: 'clr', targetType: 'obstacle', targetId: plan.involvedObstacleIds![0], change: 'clear' }, plan.affectedArea.center);
    const c = plan.affectedArea.center;
    robotHandle.pos.set(c[0], c[1], c[2]);
    update(0.016);
    update(0.016);

    expect(useIncidentRuntimeStore.getState().runtime.status).toBe('completed');
    expect(useAdvancedMissionZoneStore.getState().resolvedIncidentIds).toContain('incident_seg_cargo_street');
    cleanup();
  });
});
