import { useIncidentRuntimeStore } from '../../stores/useIncidentRuntimeStore';
import * as Director from './AIIncidentDirector';
import { forceEscalate } from './IncidentEscalationController';
import { recordIncidentSupportUsed, recordIncidentSkillUsed } from './IncidentCompletionEvaluator';
import { exportSnapshotJson } from './IncidentSnapshotController';
import { recordIncidentObjectiveComplete } from './IncidentZoneAdapter';

// God-mode / debug helpers for the Incident Debug Panel (Batch G §15). All routed through the director so the
// debug surface never mutates world state directly.
export function debugForceCompleteObjective(stepId: string): void {
  const store = useIncidentRuntimeStore.getState();
  store.addCompletedObjective(stepId);
  if (store.plan) recordIncidentObjectiveComplete(store.plan.incidentId, stepId);
}

export function debugForceCompleteIncident(): void {
  Director.completeIncident();
}

export function debugForceFailIncident(): void {
  Director.failIncident();
}

export function debugToggleFreezeEscalation(): void {
  const cur = useIncidentRuntimeStore.getState().runtime.debug.freezeEscalation;
  useIncidentRuntimeStore.getState().setDebug({ freezeEscalation: !cur });
}

export function debugIncreaseDanger(): void {
  const plan = useIncidentRuntimeStore.getState().plan;
  if (plan) forceEscalate(plan);
}

export function debugToggleForceComplete(): void {
  const cur = useIncidentRuntimeStore.getState().runtime.debug.forceComplete;
  useIncidentRuntimeStore.getState().setDebug({ forceComplete: !cur });
}

export function debugRecordSupportUsed(id: string): void { recordIncidentSupportUsed(id); }
export function debugRecordSkillUsed(skillId: string, targetId?: string): void { recordIncidentSkillUsed(skillId, targetId); }

export function debugExportSnapshot(): string { return exportSnapshotJson(); }
export function debugClearIncident(): void { Director.cleanup(); }
