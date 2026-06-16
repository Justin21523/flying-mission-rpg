import { describe, it, expect, beforeEach } from 'vitest';
import { applyOneChange } from '../../game/incidents/IncidentApplicationController';
import { useIncidentNpcStateStore, getIncidentNpcState } from '../../stores/useIncidentNpcStateStore';
import { useIncidentObjectStateStore, getIncidentObjectState } from '../../stores/useIncidentObjectStateStore';
import { useIncidentHazardStore } from '../../stores/useIncidentHazardStore';

describe('IncidentApplicationController (Batch G)', () => {
  beforeEach(() => {
    useIncidentNpcStateStore.getState().clearAll();
    useIncidentObjectStateStore.getState().clearAll();
    useIncidentHazardStore.getState().clearAll();
  });
  const center: [number, number, number] = [0, 0, 0];

  it('applies an npc trapped state', () => {
    applyOneChange({ id: 'a', targetType: 'npc', targetId: 'incident_npc_0', change: 'set-trapped' }, center);
    expect(getIncidentNpcState('incident_npc_0')).toBe('trapped');
  });

  it('applies an object damaged state', () => {
    applyOneChange({ id: 'b', targetType: 'object', targetId: 'incident_object_0', change: 'set-damaged' }, center);
    expect(getIncidentObjectState('incident_object_0')).toBe('damaged');
  });

  it('activates a (virtual) obstacle when no live obstacle exists', () => {
    applyOneChange({ id: 'c', targetType: 'obstacle', targetId: 'incident_obstacle_0', change: 'activate' }, center);
    expect(getIncidentObjectState('incident_obstacle_0')).toBe('active');
  });

  it('spawns an environment hazard placeholder', () => {
    applyOneChange({ id: 'd', targetType: 'environment', targetId: 'incident_area_main', change: 'spawn-smoke' }, center);
    const active = Object.values(useIncidentHazardStore.getState().hazards).filter((h) => h.active);
    expect(active.some((h) => h.kind === 'smoke')).toBe(true);
  });
});
