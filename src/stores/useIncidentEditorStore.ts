import { nanoid } from 'nanoid';
import { createEditorCollection } from './game/createEditorCollection';
import type { IncidentTemplate } from '../types/incidentTemplateTypes';
import { SEED_INCIDENT_TEMPLATES } from '../data/incidents/incidentTemplates';

// Editable Incident TEMPLATE collection (Batch G, 🚨 AI Incidents editor tabs). Seed-merged at boot.
export const useIncidentEditorStore = createEditorCollection<IncidentTemplate>({
  storageKey: 'aero-rescue-editor-incident-template-v1',
  seed: SEED_INCIDENT_TEMPLATES,
  makeId: () => `tmpl_${nanoid(6)}`,
  seedVersion: 'h-incidents',
});

const SEED_BY_ID = new Map(SEED_INCIDENT_TEMPLATES.map((t) => [t.id, t]));

export function getEditableIncidentTemplate(id: string | undefined): IncidentTemplate | undefined {
  if (!id) return undefined;
  return useIncidentEditorStore.getState().items.find((t) => t.id === id) ?? SEED_BY_ID.get(id);
}
export function allIncidentTemplates(): IncidentTemplate[] {
  const items = useIncidentEditorStore.getState().items;
  return items.length ? items : SEED_INCIDENT_TEMPLATES;
}
