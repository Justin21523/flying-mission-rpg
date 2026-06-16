import type { IncidentPlan } from '../../types/aiIncidentTypes';
import { useIncidentRuntimeStore } from '../../stores/useIncidentRuntimeStore';
import { useIncidentHazardStore } from '../../stores/useIncidentHazardStore';
import { applyOneChange } from './IncidentApplicationController';

// Deterministic incident escalation (Batch G §7.8, deepened in Batch H). Time-driven (NOT per-frame LLM): every
// interval, if allowed + not frozen + below the max level, raise the escalation level and apply that level's
// REAL effects (worsen NPCs / spawn hazards / activate obstacles) — gated by aiControlParameters. Danger is
// recomputed from escalation minus resolved objectives (de-escalation). A sustained max-level incident collapses.
let lastEscalationAtMs = 0;
let baseStartMs = 0;
let maxLevelAtMs = 0;
const COLLAPSE_WINDOW_MS = 8000;

export function resetEscalation(nowMs: number): void { lastEscalationAtMs = nowMs; baseStartMs = nowMs; maxLevelAtMs = 0; }

export function tickEscalation(plan: IncidentPlan, nowMs: number): boolean {
  const rt = useIncidentRuntimeStore.getState();
  const params = plan.aiControlParameters;
  if (!params.allowEscalation || rt.runtime.debug.freezeEscalation) return false;
  const interval = (params.escalationIntervalSeconds ?? 60) * 1000;
  const maxLevel = params.maxEscalationLevel ?? 3;
  if (rt.runtime.currentEscalationLevel >= maxLevel) return false;
  if (nowMs - lastEscalationAtMs < interval) return false;

  lastEscalationAtMs = nowMs;
  const level = rt.runtime.currentEscalationLevel + 1;
  rt.patch({ currentEscalationLevel: level, status: 'escalating' });
  if (level >= maxLevel && maxLevelAtMs === 0) maxLevelAtMs = nowMs;

  // Apply this level's authored effects (deterministic), gated per-channel. Fall back to a smoke puff.
  const effects = plan.escalationEffects?.[level - 1];
  if (effects && effects.length > 0) {
    for (const c of effects) {
      if (c.targetType === 'npc' && !params.allowNPCStateChanges) continue;
      if (c.targetType === 'object' && !params.allowObjectStateChanges) continue;
      if (c.targetType === 'environment' && !params.allowEnvironmentStateChanges) continue;
      applyOneChange(c, plan.affectedArea.center);
    }
  } else if (params.allowEnvironmentStateChanges) {
    const a = plan.affectedArea;
    useIncidentHazardStore.getState().setHazard(`${a.areaId ?? 'incident_area_main'}_smoke_esc${level}`, { kind: 'smoke', areaId: a.areaId ?? 'incident_area_main', center: a.center, radius: a.radius + level, active: true });
  }

  recomputeDanger(plan);
  rt.addReplayEvent({ t: nowMs - baseStartMs, type: 'escalation', detail: `level ${level}`, value: rt.runtime.dangerLevel });
  return true;
}

// De-escalation: danger eases as non-optional objectives are resolved. base + escalation − resolved, clamped.
export function recomputeDanger(plan: IncidentPlan): void {
  const rt = useIncidentRuntimeStore.getState();
  const completed = new Set(rt.runtime.completedObjectiveStepIds);
  const doneNonOptional = plan.objectiveSteps.filter((o) => !o.optional && completed.has(o.id)).length;
  const danger = Math.min(5, Math.max(1, plan.dangerLevel + rt.runtime.currentEscalationLevel - doneNonOptional));
  if (danger !== rt.runtime.dangerLevel) rt.patch({ dangerLevel: danger });
}

// True when the incident has sat at max escalation, unresolved, beyond the collapse window → the director fails it.
export function isCollapsed(plan: IncidentPlan, nowMs: number): boolean {
  const rt = useIncidentRuntimeStore.getState();
  if (rt.runtime.status !== 'active' && rt.runtime.status !== 'escalating') return false;
  const maxLevel = plan.aiControlParameters.maxEscalationLevel ?? 3;
  return rt.runtime.currentEscalationLevel >= maxLevel && maxLevelAtMs > 0 && nowMs - maxLevelAtMs >= COLLAPSE_WINDOW_MS;
}

// Manual debug bump (Debug panel "+danger") — also applies the next level's effects.
export function forceEscalate(plan: IncidentPlan): void {
  const rt = useIncidentRuntimeStore.getState();
  const level = rt.runtime.currentEscalationLevel + 1;
  const maxLevel = plan.aiControlParameters.maxEscalationLevel ?? 3;
  rt.patch({ currentEscalationLevel: level });
  if (level >= maxLevel && maxLevelAtMs === 0) maxLevelAtMs = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const effects = plan.escalationEffects?.[level - 1];
  if (effects) for (const c of effects) applyOneChange(c, plan.affectedArea.center);
  recomputeDanger(plan);
  rt.addReplayEvent({ t: Date.now() - baseStartMs, type: 'escalation', detail: 'forced', value: rt.runtime.dangerLevel });
}
