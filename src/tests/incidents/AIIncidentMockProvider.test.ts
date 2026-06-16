import { describe, it, expect } from 'vitest';
import { readIncidentWorldState } from '../../game/incidents/IncidentWorldStateReader';
import { generateMockPlan } from '../../game/incidents/AIIncidentMockProvider';
import { requestIncidentPlan } from '../../game/incidents/AIIncidentPlanner';
import { validateIncidentPlan } from '../../game/incidents/IncidentValidation';
import { SEED_INCIDENT_TEMPLATES } from '../../data/incidents/incidentTemplates';

describe('AIIncidentMockProvider + planner (Batch G)', () => {
  it('produces a VALID plan for every seed template', () => {
    const world = readIncidentWorldState();
    for (const t of SEED_INCIDENT_TEMPLATES) {
      const plan = generateMockPlan(world, { templateId: t.id, incidentId: `inc_${t.id}` });
      const r = validateIncidentPlan(plan, world);
      expect(r.ok, `${t.id}: ${r.errors.join(', ')}`).toBe(true);
      expect(plan.objectiveSteps.length).toBeGreaterThan(0);
      expect(plan.availableSolutions.length).toBeGreaterThanOrEqual(2);
      expect(plan.editorMeta?.generatedBy).toBe('mock');
    }
  });

  it('the planner pipeline returns a validated candidate for mock mode', () => {
    const world = readIncidentWorldState();
    const res = requestIncidentPlan({ mode: 'mock', world, templateId: 'tmpl_mechanical_failure' });
    expect(res.validation.ok).toBe(true);
    expect(res.plan).toBeTruthy();
  });

  it('the planner rejects malformed manual JSON', () => {
    const world = readIncidentWorldState();
    const res = requestIncidentPlan({ mode: 'manual-json', world, manualJson: '{ not valid json' });
    expect(res.validation.ok).toBe(false);
    expect(res.plan).toBeUndefined();
  });
});
