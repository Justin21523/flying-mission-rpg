import { describe, it, expect } from 'vitest';
import { readIncidentWorldState } from '../../game/incidents/IncidentWorldStateReader';
import { generateMockPlan } from '../../game/incidents/AIIncidentMockProvider';
import { validateIncidentPlan } from '../../game/incidents/IncidentValidation';
import type { IncidentStateChange } from '../../types/incidentTypes';

describe('IncidentValidation (Batch G)', () => {
  const world = readIncidentWorldState();
  const plan = generateMockPlan(world, { templateId: 'tmpl_road_accident', incidentId: 'inc_test' });

  it('a valid mock plan passes', () => {
    expect(validateIncidentPlan(plan, world).ok).toBe(true);
  });

  it('an unknown npc id fails', () => {
    const r = validateIncidentPlan({ ...plan, involvedNPCIds: ['ghost_npc'] }, world);
    expect(r.ok).toBe(false);
    expect(r.errors.join(' ')).toContain('ghost_npc');
  });

  it('an unknown object id fails', () => {
    expect(validateIncidentPlan({ ...plan, involvedObjectIds: ['ghost_object'] }, world).ok).toBe(false);
  });

  it('a missing success condition fails', () => {
    expect(validateIncidentPlan({ ...plan, successConditions: [] }, world).ok).toBe(false);
  });

  it('an unknown state change fails', () => {
    const bad: IncidentStateChange = { id: 'x', targetType: 'npc', targetId: plan.involvedNPCIds[0], change: 'set-teleported' as never };
    expect(validateIncidentPlan({ ...plan, initialStateChanges: [bad] }, world).ok).toBe(false);
  });

  it('a recommended character that does not exist fails', () => {
    expect(validateIncidentPlan({ ...plan, recommendedCharacterIds: ['char_ghost'] }, world).ok).toBe(false);
  });
});
