import type { IncidentPlan } from '../../types/aiIncidentTypes';
import type { IncidentWorldStateSnapshot } from '../../types/incidentWorldStateTypes';
import type { IncidentStateChange, IncidentCondition, RescueRoleTag } from '../../types/incidentTypes';
import { RESCUE_ROLE_TAGS, INCIDENT_TYPES, INCIDENT_NPC_CHANGES, INCIDENT_OBJECT_CHANGES, INCIDENT_OBSTACLE_CHANGES, INCIDENT_ENVIRONMENT_CHANGES } from '../../types/incidentTypes';
import { validatePlanShape } from './ai/IncidentPlanSchema';

const VALID_CHANGES: Record<IncidentStateChange['targetType'], readonly string[]> = {
  npc: INCIDENT_NPC_CHANGES, object: INCIDENT_OBJECT_CHANGES, obstacle: INCIDENT_OBSTACLE_CHANGES, environment: INCIDENT_ENVIRONMENT_CHANGES,
};

// Strict incident validation (Batch G §7.5). An invalid plan is NEVER applied to the world. Checks every
// referenced id against the world snapshot — the AI cannot reference non-existent npc/object/device, nor make a
// non-existent character the only solution.
export interface IncidentValidationResult { ok: boolean; errors: string[]; warnings: string[] }

export function validateIncidentPlan(plan: IncidentPlan, world: IncidentWorldStateSnapshot): IncidentValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const shape = validatePlanShape(plan);
  if (!shape.ok) return { ok: false, errors: shape.errors, warnings };

  const npc = new Set(world.npcIds);
  const obj = new Set([...world.objectIds, ...world.safeAreaIds]);
  const obs = new Set(world.obstacleIds);
  const dev = new Set(world.deviceIds);
  const eg = new Set(world.enemyGroupIds);
  const chars = new Set(world.availableCharacterIds);
  const zoneConds = new Set(world.existingZoneConditionIds);

  if (!INCIDENT_TYPES.includes(plan.incidentType)) errors.push(`unknown incidentType "${plan.incidentType}"`);
  if (plan.locationId !== world.locationId) warnings.push(`plan.locationId "${plan.locationId}" != world "${world.locationId}"`);
  if (plan.zoneId && world.zoneId && plan.zoneId !== world.zoneId) errors.push(`zoneId "${plan.zoneId}" does not match active zone`);
  if (plan.segmentId && world.segmentId && plan.segmentId !== world.segmentId) warnings.push(`segmentId "${plan.segmentId}" != active segment`);
  if (plan.affectedArea.radius <= 0) errors.push('affectedArea.radius must be > 0');
  if (plan.dangerLevel < 1 || plan.dangerLevel > 5) errors.push('dangerLevel must be 1..5');
  if (plan.timeLimitSeconds != null && (plan.timeLimitSeconds < 5 || plan.timeLimitSeconds > 1200)) errors.push('timeLimitSeconds out of range (5..1200)');
  if (plan.objectiveSteps.length === 0) errors.push('objectiveSteps must not be empty');
  if (plan.successConditions.length === 0) errors.push('successConditions must not be empty');

  for (const id of plan.involvedNPCIds) if (!npc.has(id)) errors.push(`involved npc "${id}" does not exist`);
  for (const id of plan.involvedObjectIds) if (!obj.has(id)) errors.push(`involved object "${id}" does not exist`);
  for (const id of plan.involvedObstacleIds ?? []) if (!obs.has(id)) errors.push(`involved obstacle "${id}" does not exist`);
  for (const id of plan.involvedDeviceIds ?? []) if (!dev.has(id)) errors.push(`involved device "${id}" does not exist`);
  for (const id of plan.involvedEnemyGroupIds ?? []) if (!eg.has(id)) errors.push(`involved enemy group "${id}" does not exist`);

  for (const r of plan.requiredRescueRoles) if (!RESCUE_ROLE_TAGS.includes(r as RescueRoleTag)) errors.push(`unknown rescue role "${r}"`);
  for (const c of plan.recommendedCharacterIds) if (!chars.has(c)) errors.push(`recommended character "${c}" does not exist`);

  const targetExists = (s: IncidentStateChange): boolean =>
    s.targetType === 'npc' ? npc.has(s.targetId)
      : s.targetType === 'object' ? obj.has(s.targetId)
        : s.targetType === 'obstacle' ? (obs.has(s.targetId) || dev.has(s.targetId))
          : true; // environment targets are area ids (incident-owned), always allowed
  const checkChanges = (cs: IncidentStateChange[] | undefined, where: string) => {
    for (const s of cs ?? []) {
      if (!targetExists(s)) errors.push(`${where}: state change target "${s.targetId}" (${s.targetType}) does not exist`);
      if (!VALID_CHANGES[s.targetType].includes(s.change)) errors.push(`${where}: unknown ${s.targetType} state change "${s.change}"`);
    }
  };
  checkChanges(plan.initialStateChanges, 'initialStateChanges');
  checkChanges(plan.postSuccessStateChanges, 'postSuccessStateChanges');
  checkChanges(plan.postFailureStateChanges, 'postFailureStateChanges');
  (plan.escalationEffects ?? []).forEach((level, i) => checkChanges(level, `escalationEffects[${i}]`));

  const checkCondition = (c: IncidentCondition, where: string) => {
    switch (c.type) {
      case 'npc-state': if (!npc.has(c.npcId)) errors.push(`${where}: npc-state unknown npc "${c.npcId}"`); break;
      case 'object-state': if (!obj.has(c.objectId)) errors.push(`${where}: object-state unknown object "${c.objectId}"`); break;
      case 'obstacle-state': if (!obs.has(c.obstacleId) && !dev.has(c.obstacleId)) errors.push(`${where}: obstacle-state unknown obstacle "${c.obstacleId}"`); break;
      case 'device-repaired': if (!dev.has(c.deviceId)) errors.push(`${where}: device-repaired unknown device "${c.deviceId}"`); break;
      case 'enemy-group-cleared': if (!eg.has(c.enemyGroupId)) errors.push(`${where}: unknown enemy group "${c.enemyGroupId}"`); break;
      case 'zone-condition-complete': if (zoneConds.size > 0 && !zoneConds.has(c.conditionId)) warnings.push(`${where}: zone condition "${c.conditionId}" not on active segment`); break;
      default: break;
    }
  };
  plan.objectiveSteps.forEach((o, i) => {
    if (o.completionConditions.length === 0) errors.push(`objective ${o.id || i} has no completionConditions`);
    o.completionConditions.forEach((c) => checkCondition(c, `objective ${o.id || i}`));
  });
  plan.successConditions.forEach((c) => checkCondition(c, 'successConditions'));
  plan.failureConditions.forEach((c) => checkCondition(c, 'failureConditions'));

  // Solutions: targets must exist; at least 2 solutions so no single mandatory character.
  if (plan.availableSolutions.length < 2) warnings.push('fewer than 2 solutions — incident may force a single approach');
  for (const sol of plan.availableSolutions) {
    for (const t of sol.targetIds) if (!npc.has(t) && !obj.has(t) && !obs.has(t) && !dev.has(t) && !eg.has(t)) warnings.push(`solution "${sol.id}" targets unknown id "${t}"`);
    checkChanges(sol.expectedStateChanges, `solution ${sol.id}`);
  }

  return { ok: errors.length === 0, errors, warnings };
}
