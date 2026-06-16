import { describe, it, expect } from 'vitest';
import { SEED_INCIDENT_TEMPLATES } from '../../data/incidents/incidentTemplates';
import { INCIDENT_TYPES } from '../../types/incidentTypes';
import { readIncidentWorldState } from '../../game/incidents/IncidentWorldStateReader';
import { generateMockPlan } from '../../game/incidents/AIIncidentMockProvider';
import { validateIncidentPlan } from '../../game/incidents/IncidentValidation';
import { pickVariedTemplate, resetVarietyHistory } from '../../game/incidents/IncidentVarietyDirector';

describe('Incident variety (Batch H)', () => {
  it('has a seed template for every IncidentType (12)', () => {
    const types = new Set(SEED_INCIDENT_TEMPLATES.map((t) => t.incidentType));
    for (const ty of INCIDENT_TYPES) expect(types.has(ty), `missing template for ${ty}`).toBe(true);
    expect(SEED_INCIDENT_TEMPLATES.length).toBeGreaterThanOrEqual(12);
  });

  it('every one of the 12 templates produces a valid plan', () => {
    const world = readIncidentWorldState();
    for (const t of SEED_INCIDENT_TEMPLATES) {
      const plan = generateMockPlan(world, { templateId: t.id, incidentId: `inc_${t.id}` });
      const r = validateIncidentPlan(plan, world);
      expect(r.ok, `${t.id}: ${r.errors.join(', ')}`).toBe(true);
    }
  });

  it('the variety director cycles through multiple incident types', () => {
    resetVarietyHistory();
    const world = readIncidentWorldState();
    const picked = new Set<string>();
    for (let i = 0; i < 16; i++) picked.add(pickVariedTemplate(world).incidentType);
    expect(picked.size).toBeGreaterThan(3);
  });
});
