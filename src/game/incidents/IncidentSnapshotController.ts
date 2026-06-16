import type { IncidentPlan } from '../../types/aiIncidentTypes';
import type { IncidentTemplate } from '../../types/incidentTemplateTypes';
import type { IncidentReplayData } from '../../types/incidentReplayTypes';
import { useIncidentRuntimeStore } from '../../stores/useIncidentRuntimeStore';
import { useIncidentEditorStore } from '../../stores/useIncidentEditorStore';
import { getIncidentTemplate } from '../../data/incidents/incidentTemplates';

// Snapshot / template export (Batch G §7, §17). Exports the active incident (plan + runtime + replay) as JSON,
// imports a plan, and creates a reusable Edit-Mode template from the active incident.
export interface IncidentSnapshot {
  plan?: IncidentPlan;
  runtime: ReturnType<typeof useIncidentRuntimeStore.getState>['runtime'];
}

export function exportSnapshot(): IncidentSnapshot {
  const s = useIncidentRuntimeStore.getState();
  return { plan: s.plan, runtime: s.runtime };
}

export function exportSnapshotJson(): string {
  return JSON.stringify(exportSnapshot(), null, 2);
}

export function exportReplayData(): IncidentReplayData | undefined {
  const s = useIncidentRuntimeStore.getState();
  if (!s.plan) return undefined;
  return { incidentId: s.plan.incidentId, plan: s.plan, events: s.runtime.replayEvents, finalStatus: s.runtime.status, durationMs: (s.runtime.completedAt ?? Date.now()) - (s.runtime.startedAt ?? Date.now()) };
}

// Build a reusable template from the active incident's plan (Batch G §7.1 createTemplateFromSnapshot).
export function createTemplateFromPlan(plan: IncidentPlan): IncidentTemplate {
  const base = getIncidentTemplate(plan.templateId);
  const npcSlots = new Set(plan.involvedNPCIds).size;
  const objSlots = new Set(plan.involvedObjectIds).size;
  const obsSlots = new Set(plan.involvedObstacleIds ?? []).size;
  const devSlots = new Set(plan.involvedDeviceIds ?? []).size;
  const egSlots = new Set(plan.involvedEnemyGroupIds ?? []).size;
  return {
    id: `tmpl_${plan.incidentType}_${Date.now().toString(36)}`,
    incidentType: plan.incidentType,
    title: `${plan.title} (template)`,
    description: plan.description,
    dangerLevel: plan.dangerLevel,
    recommendedCharacterIds: plan.recommendedCharacterIds,
    requiredRescueRoles: plan.requiredRescueRoles,
    npcSlotCount: npcSlots, objectSlotCount: objSlots, obstacleSlotCount: obsSlots, deviceSlotCount: devSlots, enemyGroupSlotCount: egSlots,
    defaultObjectives: plan.objectiveSteps,
    defaultInitialStateChanges: plan.initialStateChanges,
    defaultSolutions: plan.availableSolutions,
    defaultPostSuccessStateChanges: plan.postSuccessStateChanges,
    timeLimitSeconds: plan.timeLimitSeconds,
    aiControlParameters: plan.aiControlParameters,
    editorMeta: { authorNotes: 'Created from a runtime incident snapshot', tags: base?.editorMeta?.tags, difficulty: plan.editorMeta?.difficulty },
    enabled: true,
  };
}

// Persist a new template into the editor store (duplicate-as-template).
export function saveTemplateFromPlan(plan: IncidentPlan): string {
  const tmpl = createTemplateFromPlan(plan);
  useIncidentEditorStore.getState().upsert(tmpl);
  return tmpl.id;
}
