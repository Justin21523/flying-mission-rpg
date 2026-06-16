import { describe, it, expect, beforeEach } from 'vitest';
import { readIncidentWorldState } from '../../game/incidents/IncidentWorldStateReader';
import { generateMockPlan } from '../../game/incidents/AIIncidentMockProvider';
import { createTemplateFromPlan, saveTemplateFromPlan, exportSnapshot } from '../../game/incidents/IncidentSnapshotController';
import { applyIncidentPlan, cleanup } from '../../game/incidents/AIIncidentDirector';
import { useIncidentEditorStore } from '../../stores/useIncidentEditorStore';
import { validateIncidentPlan } from '../../game/incidents/IncidentValidation';

describe('IncidentSnapshotController (Batch G)', () => {
  beforeEach(() => cleanup());

  it('creates a valid template from a plan (round-trip)', () => {
    const world = readIncidentWorldState();
    const plan = generateMockPlan(world, { templateId: 'tmpl_npc_trapped', incidentId: 'inc_snap' });
    const tmpl = createTemplateFromPlan(plan);
    expect(tmpl.incidentType).toBe(plan.incidentType);
    expect(tmpl.defaultObjectives.length).toBe(plan.objectiveSteps.length);
    expect(tmpl.defaultSolutions.length).toBe(plan.availableSolutions.length);
  });

  it('saveTemplateFromPlan adds a template to the editor store', () => {
    const world = readIncidentWorldState();
    const plan = generateMockPlan(world, { templateId: 'tmpl_road_accident', incidentId: 'inc_snap2' });
    const before = useIncidentEditorStore.getState().items.length;
    const id = saveTemplateFromPlan(plan);
    expect(useIncidentEditorStore.getState().items.find((t) => t.id === id)).toBeTruthy();
    expect(useIncidentEditorStore.getState().items.length).toBe(before + 1);
  });

  it('exportSnapshot captures the applied plan + runtime', () => {
    const world = readIncidentWorldState();
    const plan = generateMockPlan(world, { templateId: 'tmpl_road_accident', incidentId: 'inc_snap3' });
    expect(validateIncidentPlan(plan, world).ok).toBe(true);
    applyIncidentPlan(plan);
    const snap = exportSnapshot();
    expect(snap.plan?.incidentId).toBe('inc_snap3');
    expect(snap.runtime.status).toBe('active');
    cleanup();
  });
});
