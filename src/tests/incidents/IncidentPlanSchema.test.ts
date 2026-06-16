import { describe, it, expect } from 'vitest';
import { validatePlanShape } from '../../game/incidents/ai/IncidentPlanSchema';
import { sanitizePlan } from '../../game/incidents/ai/IncidentPlanSanitizer';
import { repairPlan } from '../../game/incidents/ai/IncidentPlanRepair';
import { readIncidentWorldState } from '../../game/incidents/IncidentWorldStateReader';
import { generateMockPlan } from '../../game/incidents/AIIncidentMockProvider';

describe('IncidentPlan schema / sanitizer / repair (Batch G)', () => {
  const world = readIncidentWorldState();
  const plan = generateMockPlan(world, { templateId: 'tmpl_road_accident', incidentId: 'inc_schema' });

  it('shape validation accepts a real plan + rejects junk', () => {
    expect(validatePlanShape(plan).ok).toBe(true);
    expect(validatePlanShape({ hello: 'world' }).ok).toBe(false);
    expect(validatePlanShape(null).ok).toBe(false);
    expect(validatePlanShape({ ...plan, objectiveSteps: [] }).ok).toBe(false);
  });

  it('sanitizer flags references absent from the world snapshot', () => {
    const { flags } = sanitizePlan({ ...plan, involvedNPCIds: ['ghost'] }, world);
    expect(flags.join(' ')).toContain('unknown npc ghost');
  });

  it('sanitizer clamps an out-of-range dangerLevel', () => {
    const { plan: out } = sanitizePlan({ ...plan, dangerLevel: 9 as never }, world);
    expect(out.dangerLevel).toBe(5);
  });

  it('repair fixes danger range + ensures editorMeta + objective order', () => {
    const repaired = repairPlan({ ...plan, dangerLevel: 0 as never, editorMeta: undefined });
    expect(repaired.dangerLevel).toBeGreaterThanOrEqual(1);
    expect(repaired.editorMeta).toBeTruthy();
    expect(repaired.objectiveSteps.every((o) => typeof o.order === 'number')).toBe(true);
  });
});
