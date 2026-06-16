import type { IncidentPlan } from '../../types/aiIncidentTypes';
import { robotHandle } from '../destination/robotHandle';
import { applyNpcChange } from './IncidentNPCStateController';
import { extinguishArea } from './IncidentEnvironmentStateController';
import { objectiveStepComplete } from './IncidentCompletionEvaluator';
import { useIncidentRuntimeStore } from '../../stores/useIncidentRuntimeStore';

// Per-frame objective progression (Batch G §7). For reach/rescue/evacuate/extinguish/stabilize steps, standing
// in the affected area performs the step's world action (so the player resolves the incident by playing — walk
// to the rescue, use a repair/heavy skill for repair/clear). Marks steps complete when their conditions hold.
function playerInArea(plan: IncidentPlan): boolean {
  const cx = plan.affectedArea.center[0], cz = plan.affectedArea.center[2];
  const r = Math.max(6, plan.affectedArea.radius);
  const dx = robotHandle.pos.x - cx, dz = robotHandle.pos.z - cz;
  return dx * dx + dz * dz <= r * r;
}

export function tickIncidentObjectives(plan: IncidentPlan, nowMs: number, startedAtMs: number): void {
  const rt = useIncidentRuntimeStore.getState();
  const done = new Set(rt.runtime.completedObjectiveStepIds);
  const inArea = playerInArea(plan);

  for (const step of plan.objectiveSteps) {
    if (done.has(step.id)) continue;

    // Reach-driven world actions (the player resolving the step by being there).
    if (inArea) {
      if ((step.objectiveType === 'rescue-npc' || step.objectiveType === 'evacuate-npc') && step.targetId) {
        applyNpcChange(step.targetId, 'set-safe', plan.affectedArea.center, 0);
      } else if (step.objectiveType === 'stabilize-npc' && step.targetId) {
        applyNpcChange(step.targetId, 'set-waiting-rescue', plan.affectedArea.center, 0);
      } else if (step.objectiveType === 'extinguish-fire-placeholder') {
        extinguishArea(plan.affectedArea.areaId ?? 'incident_area_main', plan.affectedArea.center);
      }
    }

    if (objectiveStepComplete(step, plan, nowMs, startedAtMs)) {
      rt.addCompletedObjective(step.id);
      rt.addReplayEvent({ t: nowMs - startedAtMs, type: 'objective-completed', detail: step.label, targetId: step.targetId });
    }
  }
}

export function requiredObjectivesComplete(plan: IncidentPlan): boolean {
  const done = new Set(useIncidentRuntimeStore.getState().runtime.completedObjectiveStepIds);
  return plan.objectiveSteps.filter((o) => !o.optional).every((o) => done.has(o.id));
}
