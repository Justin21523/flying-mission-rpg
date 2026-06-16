import type { IncidentPlan, IncidentPlanProviderMode } from '../../types/aiIncidentTypes';
import { useIncidentRuntimeStore } from '../../stores/useIncidentRuntimeStore';
import { readIncidentWorldState } from './IncidentWorldStateReader';
import { requestIncidentPlan as plannerRequest, type IncidentPlanResult } from './AIIncidentPlanner';
import { validateIncidentPlan } from './IncidentValidation';
import { applyInitialStateChanges, applyPostSuccessStateChanges, applyPostFailureStateChanges } from './IncidentApplicationController';
import { tickIncidentObjectives } from './IncidentObjectiveRuntime';
import { successMet, failureMet, resetIncidentActionLog } from './IncidentCompletionEvaluator';
import { tickEscalation, resetEscalation, recomputeDanger, isCollapsed } from './IncidentEscalationController';
import { tickNpcBehavior } from './IncidentNpcBehaviorController';
import { recordIncidentObjectiveComplete, recordIncidentResolved, recordIncidentFailed } from './IncidentZoneAdapter';
import { exportReplayData, saveTemplateFromPlan } from './IncidentSnapshotController';
import { cleanupIncidentNpcs } from './IncidentNPCStateController';
import { cleanupIncidentObjects } from './IncidentObjectStateController';
import { cleanupIncidentHazards } from './IncidentEnvironmentStateController';

// The single entry point for the incident runtime (Batch G §7.1). UI never touches NPC/object/environment state
// directly. Plan → validate → apply → run → complete/fail, with snapshot/replay/template hooks.
const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

export function initializeForZone(zoneId?: string): void {
  void zoneId;
  cleanup();
}

export function requestIncidentPlanForCurrentWorld(opts?: { mode?: IncidentPlanProviderMode; templateId?: string; manualJson?: string; incidentId?: string }): IncidentPlanResult {
  const world = readIncidentWorldState();
  const result = plannerRequest({ mode: opts?.mode ?? 'mock', world, templateId: opts?.templateId, manualJson: opts?.manualJson, incidentId: opts?.incidentId });
  useIncidentRuntimeStore.getState().setCandidate(result.plan, result.validation.errors);
  if (result.validation.errors.length === 0) useIncidentRuntimeStore.getState().patch({ validationErrors: [] });
  return result;
}

export function validatePlan(plan: IncidentPlan) {
  return validateIncidentPlan(plan, readIncidentWorldState());
}

// Apply a VALIDATED plan to the world. Refuses to apply an invalid plan (§0.10).
export function applyIncidentPlan(plan: IncidentPlan): boolean {
  const validation = validatePlan(plan);
  const rt = useIncidentRuntimeStore.getState();
  if (!validation.ok) {
    rt.patch({ status: 'validation-failed', validationErrors: validation.errors });
    return false;
  }
  const t = nowMs();
  rt.setPlan(plan);
  rt.patch({ activeIncidentId: plan.incidentId, activeTemplateId: plan.templateId, status: 'applying', startedAt: t, dangerLevel: plan.dangerLevel, currentEscalationLevel: 0, timeRemainingSeconds: plan.timeLimitSeconds, completedObjectiveStepIds: [], failedObjectiveStepIds: [], appliedStateChangeIds: [], validationErrors: [] });
  resetIncidentActionLog();
  resetEscalation(t);
  applyInitialStateChanges(plan);
  rt.setStatus('active');
  rt.addReplayEvent({ t: 0, type: 'incident-started', detail: plan.title });
  return true;
}

export function startIncident(): void {
  const rt = useIncidentRuntimeStore.getState();
  if (rt.runtime.status === 'ready' && rt.candidatePlan) applyIncidentPlan(rt.candidatePlan);
}

// Convenience for zone hooks + debug: generate a mock incident and apply it.
export function generateAndStart(opts?: { mode?: IncidentPlanProviderMode; templateId?: string; incidentId?: string }): boolean {
  // Don't re-trigger if an incident is already live for this id.
  const cur = useIncidentRuntimeStore.getState();
  if (opts?.incidentId && cur.plan?.incidentId === opts.incidentId && (cur.runtime.status === 'active' || cur.runtime.status === 'escalating')) return false;
  const result = requestIncidentPlanForCurrentWorld(opts);
  return result.plan ? applyIncidentPlan(result.plan) : false;
}

export function update(dtSeconds: number): void {
  const store = useIncidentRuntimeStore.getState();
  const { runtime: s, plan } = store;
  if (!plan || (s.status !== 'active' && s.status !== 'escalating')) return;
  const t = nowMs();
  const startedAt = s.startedAt ?? t;

  if (s.debug.forceComplete) { completeIncident(); return; }

  tickIncidentObjectives(plan, t, startedAt);
  for (const id of useIncidentRuntimeStore.getState().runtime.completedObjectiveStepIds) recordIncidentObjectiveComplete(plan.incidentId, id);
  // Batch H — NPCs flee/evacuate/get rescued (after the objective tick so a just-rescued NPC isn't moved away).
  tickNpcBehavior(plan, Math.min(0.1, dtSeconds), t);
  tickEscalation(plan, t);
  recomputeDanger(plan); // de-escalation as objectives resolve

  if (plan.timeLimitSeconds != null) store.patch({ timeRemainingSeconds: Math.max(0, plan.timeLimitSeconds - (t - startedAt) / 1000) });

  if (isCollapsed(plan, t)) { store.addReplayEvent({ t: t - startedAt, type: 'failed', detail: 'escalation collapse' }); failIncident(); return; }
  if (failureMet(plan, t, startedAt)) { failIncident(); return; }
  if (successMet(plan, t, startedAt)) { completeIncident(); }
}

export function completeIncident(): void {
  const store = useIncidentRuntimeStore.getState();
  const plan = store.plan;
  if (!plan) return;
  store.patch({ status: 'success', completedAt: nowMs() });
  applyPostSuccessStateChanges(plan);
  for (const id of store.runtime.completedObjectiveStepIds) recordIncidentObjectiveComplete(plan.incidentId, id);
  recordIncidentResolved(plan.incidentId);
  store.addReplayEvent({ t: nowMs() - (store.runtime.startedAt ?? nowMs()), type: 'success', detail: plan.title });
  const replay = exportReplayData(); if (replay) store.saveReplay(replay);
  store.setStatus('completed');
}

export function failIncident(): void {
  const store = useIncidentRuntimeStore.getState();
  const plan = store.plan;
  if (!plan) return;
  store.patch({ status: 'failed', completedAt: nowMs() });
  applyPostFailureStateChanges(plan);
  recordIncidentFailed(plan.incidentId);
  store.addReplayEvent({ t: nowMs() - (store.runtime.startedAt ?? nowMs()), type: 'failed', detail: plan.title });
  const replay = exportReplayData(); if (replay) store.saveReplay(replay);
}

export function cancelIncident(): void {
  const store = useIncidentRuntimeStore.getState();
  if (store.plan) store.addReplayEvent({ t: nowMs() - (store.runtime.startedAt ?? nowMs()), type: 'cancelled' });
  store.setStatus('cancelled');
  cleanup();
}

export function saveSnapshot(): void {
  const replay = exportReplayData();
  if (replay) useIncidentRuntimeStore.getState().saveReplay(replay);
}

export function createTemplateFromSnapshot(): string | undefined {
  const plan = useIncidentRuntimeStore.getState().plan;
  return plan ? saveTemplateFromPlan(plan) : undefined;
}

export function cleanup(): void {
  cleanupIncidentNpcs();
  cleanupIncidentObjects();
  cleanupIncidentHazards();
  resetIncidentActionLog();
  useIncidentRuntimeStore.getState().reset();
}
