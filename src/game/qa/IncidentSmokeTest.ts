import type { QACheck } from './ReleaseCandidateChecklist';
import { makeSmokeCheck } from './SmokeTestRunner';
import { allIncidentTemplates, getEditableIncidentTemplate } from '../../stores/useIncidentEditorStore';

export function runIncidentSmokeTest(): QACheck[] {
  const templates = allIncidentTemplates();
  const road = getEditableIncidentTemplate('tmpl_road_accident');
  const templatesHaveShape = templates.every((template) => template.id && template.incidentType && template.defaultObjectives.length > 0 && template.defaultSolutions.length > 0);
  return [
    makeSmokeCheck('incident_templates_exist', 'Incident templates exist', 'incident', templates.length >= 10, 'Expected at least 10 incident templates.'),
    makeSmokeCheck('incident_road_template_exists', 'Road accident template exists', 'incident', !!road, 'Road accident template is missing.'),
    makeSmokeCheck('incident_templates_validate', 'Incident templates have valid runtime shape', 'incident', templatesHaveShape, 'One or more incident templates are missing objectives or success conditions.'),
  ];
}
