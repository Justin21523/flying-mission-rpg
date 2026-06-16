import type { IncidentPlan, IncidentPlanProviderMode } from '../../types/aiIncidentTypes';
import type { IncidentWorldStateSnapshot } from '../../types/incidentWorldStateTypes';
import { generateMockPlan } from './AIIncidentMockProvider';
import { validatePlanShape } from './ai/IncidentPlanSchema';
import { sanitizePlan } from './ai/IncidentPlanSanitizer';
import { repairPlan } from './ai/IncidentPlanRepair';
import { validateIncidentPlan, type IncidentValidationResult } from './IncidentValidation';

// Orchestrates provider → repair → sanitize → validate (Batch G §7.2). Returns a VALIDATED candidate (or the
// validation errors). The LLM/mock never bypasses this pipeline. Sync for mock/template/manual; 'future-llm'
// falls back to mock in this foundation batch (the prompt builder is ready, but no external call is required).
export interface IncidentPlanRequest {
  mode: IncidentPlanProviderMode;
  world: IncidentWorldStateSnapshot;
  templateId?: string;
  incidentId?: string;
  manualJson?: string;
}

export interface IncidentPlanResult {
  plan?: IncidentPlan;
  validation: IncidentValidationResult;
  flags: string[];
}

function rawFromMode(req: IncidentPlanRequest): { plan?: IncidentPlan; errors?: string[] } {
  switch (req.mode) {
    case 'manual-json': {
      if (!req.manualJson?.trim()) return { errors: ['no manual JSON provided'] };
      let parsed: unknown;
      try { parsed = JSON.parse(req.manualJson); } catch (e) { return { errors: [`invalid JSON: ${(e as Error).message}`] }; }
      const shape = validatePlanShape(parsed);
      return shape.ok ? { plan: shape.plan } : { errors: shape.errors };
    }
    case 'template-random':
      return { plan: generateMockPlan(req.world, { templateId: req.templateId, incidentId: req.incidentId, random: true }) };
    case 'mock':
    case 'future-llm':
    default:
      return { plan: generateMockPlan(req.world, { templateId: req.templateId, incidentId: req.incidentId }) };
  }
}

export function requestIncidentPlan(req: IncidentPlanRequest): IncidentPlanResult {
  const raw = rawFromMode(req);
  if (!raw.plan) return { validation: { ok: false, errors: raw.errors ?? ['no plan generated'], warnings: [] }, flags: [] };
  const repaired = repairPlan(raw.plan);
  const { plan: sanitized, flags } = sanitizePlan(repaired, req.world);
  const validation = validateIncidentPlan(sanitized, req.world);
  return { plan: validation.ok ? sanitized : undefined, validation, flags };
}
