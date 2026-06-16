import type { IncidentCondition, IncidentObjectiveStep } from '../../types/incidentTypes';
import type { IncidentPlan } from '../../types/aiIncidentTypes';
import { getIncidentNpcState } from '../../stores/useIncidentNpcStateStore';
import { getIncidentObjectState } from '../../stores/useIncidentObjectStateStore';
import { getLiveObstacle } from '../../stores/game/obstacleStore';
import { isCleared, isDestroyed, isRepaired } from '../obstacles/ObstacleDirector';
import { isGroupCleared } from '../combat/enemySpawnDirector';
import { useAdvancedMissionZoneStore } from '../../stores/game/useAdvancedMissionZoneStore';
import { robotHandle } from '../destination/robotHandle';

// Evaluates incident conditions against the LIVE world (Batch G §7.7) — deterministic, no LLM. A small action
// log captures support/skill usage relevant to the active incident (so support-/skill-driven objectives can
// complete) — fed by the debug panel + the support adapter.
const actionLog = { support: new Set<string>(), skill: new Set<string>() };
export function recordIncidentSupportUsed(id: string): void { actionLog.support.add(id); }
export function recordIncidentSkillUsed(skillId: string, targetId?: string): void { actionLog.skill.add(skillId); if (targetId) actionLog.skill.add(`${skillId}:${targetId}`); }
export function resetIncidentActionLog(): void { actionLog.support.clear(); actionLog.skill.clear(); }

function obstacleInState(id: string, state: string): boolean {
  const live = getLiveObstacle(id);
  if (live) {
    if (state === 'cleared') return isCleared(id);
    if (state === 'destroyed') return isDestroyed(id);
    if (state === 'repaired') return isRepaired(id);
    return live.state === state;
  }
  return getIncidentObjectState(id) === state;
}

export function evaluateIncidentCondition(c: IncidentCondition, plan: IncidentPlan, nowMs: number, startedAtMs: number): boolean {
  const z = useAdvancedMissionZoneStore.getState();
  switch (c.type) {
    case 'npc-state': return getIncidentNpcState(c.npcId) === c.state;
    case 'object-state': return getIncidentObjectState(c.objectId) === c.state;
    case 'obstacle-state': return obstacleInState(c.obstacleId, c.state);
    case 'device-repaired': return isRepaired(c.deviceId) || getIncidentObjectState(c.deviceId) === 'repaired';
    case 'enemy-group-cleared': return isGroupCleared(c.enemyGroupId);
    case 'zone-condition-complete': return z.currentConditionProgress[c.conditionId]?.done ?? false;
    case 'player-reached-area': {
      const cx = plan.affectedArea.center[0], cz = plan.affectedArea.center[2];
      const dx = robotHandle.pos.x - cx, dz = robotHandle.pos.z - cz;
      return dx * dx + dz * dz <= c.radius * c.radius;
    }
    case 'timer-expired': return (nowMs - startedAtMs) / 1000 >= c.seconds;
    case 'support-used':
      return actionLog.support.has(c.supportAbilityId) || z.usedSupportAbilityIds.includes(c.supportAbilityId) || z.supportScannedTargetIds.length > 0;
    case 'character-skill-used':
      return c.targetId ? actionLog.skill.has(`${c.skillId}:${c.targetId}`) : actionLog.skill.has(c.skillId);
    case 'debug-complete': return false;
    default: return false;
  }
}

export function objectiveStepComplete(step: IncidentObjectiveStep, plan: IncidentPlan, nowMs: number, startedAtMs: number): boolean {
  return step.completionConditions.length > 0 && step.completionConditions.every((c) => evaluateIncidentCondition(c, plan, nowMs, startedAtMs));
}

export function successMet(plan: IncidentPlan, nowMs: number, startedAtMs: number): boolean {
  return plan.successConditions.length > 0 && plan.successConditions.every((c) => evaluateIncidentCondition(c, plan, nowMs, startedAtMs));
}

// Failure: a timer-expired condition fires when the limit passes, OR any non-timer failure condition is met.
export function failureMet(plan: IncidentPlan, nowMs: number, startedAtMs: number): boolean {
  if (plan.failureConditions.length === 0) return false;
  return plan.failureConditions.some((c) => evaluateIncidentCondition(c, plan, nowMs, startedAtMs));
}
