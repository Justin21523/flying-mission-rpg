import type { IncidentStateChange, IncidentObstacleChange } from '../../types/incidentTypes';
import type { IncidentPlan } from '../../types/aiIncidentTypes';
import type { ObstacleState } from '../../types/game/obstacle';
import { applyNpcChange } from './IncidentNPCStateController';
import { applyObjectChange } from './IncidentObjectStateController';
import { applyEnvChange } from './IncidentEnvironmentStateController';
import { transitionState as obstacleTransition } from '../obstacles/ObstacleDirector';
import { getLiveObstacle } from '../../stores/game/obstacleStore';
import { useIncidentObjectStateStore, type IncidentObjectState } from '../../stores/useIncidentObjectStateStore';
import { useIncidentRuntimeStore } from '../../stores/useIncidentRuntimeStore';

// Applies an IncidentPlan's state changes to the world (Batch G §7.6) — ONLY through the sub-controllers +
// existing directors, never raw store writes elsewhere. Real obstacles/devices route to ObstacleDirector; if an
// obstacle id has no live instance it is tracked as a virtual incident object so objectives still resolve.
const OBSTACLE_STATE: Record<IncidentObstacleChange, ObstacleState> = {
  activate: 'active', damage: 'damaged', destroy: 'destroyed', clear: 'cleared', lock: 'locked', unlock: 'unlocked', repair: 'repaired',
};
const VIRTUAL_OBSTACLE_STATE: Record<IncidentObstacleChange, IncidentObjectState> = {
  activate: 'active', damage: 'damaged', destroy: 'cleared', clear: 'cleared', lock: 'disabled', unlock: 'active', repair: 'repaired',
};

let npcIndex = 0;

// Apply ONE change (exported for tests). Returns the change id (or a synthesized one).
export function applyOneChange(change: IncidentStateChange, center: [number, number, number]): string {
  switch (change.targetType) {
    case 'npc': applyNpcChange(change.targetId, change.change, center, npcIndex++, change.value); break;
    case 'object': applyObjectChange(change.targetId, change.change, center); break;
    case 'environment': applyEnvChange(change.targetId, change.change, center, 10); break;
    case 'obstacle': {
      if (getLiveObstacle(change.targetId)) obstacleTransition(change.targetId, OBSTACLE_STATE[change.change], true);
      else useIncidentObjectStateStore.getState().setObject(change.targetId, { state: VIRTUAL_OBSTACLE_STATE[change.change], position: center });
      break;
    }
  }
  return change.id ?? `${change.targetType}:${change.targetId}:${change.change}`;
}

function applyChanges(changes: IncidentStateChange[] | undefined, center: [number, number, number]): void {
  const rt = useIncidentRuntimeStore.getState();
  for (const c of changes ?? []) {
    const id = applyOneChange(c, center);
    rt.addAppliedChange(id);
    rt.addReplayEvent({ t: Date.now() - (rt.runtime.startedAt ?? Date.now()), type: 'state-change-applied', detail: `${c.targetType}:${c.change}`, targetId: c.targetId });
  }
}

export function applyInitialStateChanges(plan: IncidentPlan): void {
  npcIndex = 0;
  applyChanges(plan.initialStateChanges, plan.affectedArea.center);
}
export function applyPostSuccessStateChanges(plan: IncidentPlan): void {
  applyChanges(plan.postSuccessStateChanges, plan.affectedArea.center);
}
export function applyPostFailureStateChanges(plan: IncidentPlan): void {
  applyChanges(plan.postFailureStateChanges, plan.affectedArea.center);
}
