import { describe, it, expect, beforeEach } from 'vitest';
import { useIncidentEditorStore, allIncidentTemplates } from '../../stores/useIncidentEditorStore';
import { SEED_INCIDENT_TEMPLATES } from '../../data/incidents/incidentTemplates';

describe('useIncidentEditorStore (Batch G)', () => {
  beforeEach(() => useIncidentEditorStore.getState().importState({ items: SEED_INCIDENT_TEMPLATES.map((t) => ({ ...t })), seeded: true }));

  it('holds the 5 seed templates', () => {
    expect(allIncidentTemplates().length).toBeGreaterThanOrEqual(5);
    for (const t of SEED_INCIDENT_TEMPLATES) expect(useIncidentEditorStore.getState().items.find((x) => x.id === t.id)).toBeTruthy();
  });

  it('update writes a patch back', () => {
    useIncidentEditorStore.getState().update('tmpl_road_accident', { dangerLevel: 5 });
    expect(useIncidentEditorStore.getState().items.find((t) => t.id === 'tmpl_road_accident')?.dangerLevel).toBe(5);
  });

  it('duplicate adds a copy', () => {
    const before = useIncidentEditorStore.getState().items.length;
    const id = useIncidentEditorStore.getState().duplicate('tmpl_fire_event');
    expect(id).toBeTruthy();
    expect(useIncidentEditorStore.getState().items.length).toBe(before + 1);
  });
});
