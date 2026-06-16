import type { IncidentPlan } from '../../../types/aiIncidentTypes';
import { INCIDENT_TYPES } from '../../../types/incidentTypes';

// Pure shape/schema validation (Batch G §16) — "is this JSON shaped like an IncidentPlan?" Used for manual JSON
// paste + as the first gate before reference validation. No store access.

function isStr(v: unknown): v is string { return typeof v === 'string' && v.length > 0; }
function isArr(v: unknown): v is unknown[] { return Array.isArray(v); }
function isObj(v: unknown): v is Record<string, unknown> { return !!v && typeof v === 'object' && !Array.isArray(v); }

export interface SchemaResult { ok: boolean; errors: string[]; plan?: IncidentPlan }

export function validatePlanShape(raw: unknown): SchemaResult {
  const errors: string[] = [];
  if (!isObj(raw)) return { ok: false, errors: ['plan is not an object'] };
  const p = raw as Record<string, unknown>;
  if (!isStr(p.incidentId)) errors.push('incidentId must be a non-empty string');
  if (!isStr(p.incidentType) || !INCIDENT_TYPES.includes(p.incidentType as never)) errors.push('incidentType is invalid');
  if (!isStr(p.locationId)) errors.push('locationId must be a non-empty string');
  if (!isStr(p.title)) errors.push('title must be a non-empty string');
  if (typeof p.description !== 'string') errors.push('description must be a string');
  if (!isArr(p.involvedNPCIds)) errors.push('involvedNPCIds must be an array');
  if (!isArr(p.involvedObjectIds)) errors.push('involvedObjectIds must be an array');
  if (!isObj(p.affectedArea) || !isArr((p.affectedArea as Record<string, unknown>).center) || typeof (p.affectedArea as Record<string, unknown>).radius !== 'number') errors.push('affectedArea.center/radius invalid');
  if (typeof p.dangerLevel !== 'number') errors.push('dangerLevel must be a number');
  if (!isArr(p.objectiveSteps) || (p.objectiveSteps as unknown[]).length === 0) errors.push('objectiveSteps must be a non-empty array');
  if (!isArr(p.successConditions) || (p.successConditions as unknown[]).length === 0) errors.push('successConditions must be a non-empty array');
  if (!isArr(p.failureConditions)) errors.push('failureConditions must be an array');
  if (!isArr(p.availableSolutions)) errors.push('availableSolutions must be an array');
  if (!isObj(p.aiControlParameters)) errors.push('aiControlParameters must be an object');
  return errors.length ? { ok: false, errors } : { ok: true, errors: [], plan: raw as unknown as IncidentPlan };
}
