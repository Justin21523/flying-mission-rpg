import type { IncidentPlan } from '../../../types/aiIncidentTypes';
import type { IncidentWorldStateSnapshot } from '../../../types/incidentWorldStateTypes';

// Sanitizer (Batch G §16.2): clamp dangerous numeric ranges + FLAG references to ids absent from the world
// snapshot. Does NOT silently swap targets (only flags) — IncidentValidation rejects flagged plans. Pure.
export interface SanitizeResult { plan: IncidentPlan; flags: string[] }

export function sanitizePlan(plan: IncidentPlan, world: IncidentWorldStateSnapshot): SanitizeResult {
  const flags: string[] = [];
  const npc = new Set(world.npcIds);
  const obj = new Set(world.objectIds);
  const obs = new Set(world.obstacleIds);
  const dev = new Set(world.deviceIds);
  const eg = new Set(world.enemyGroupIds);
  const chars = new Set(world.availableCharacterIds);

  const clampedDanger = Math.min(5, Math.max(1, Math.round(plan.dangerLevel))) as 1 | 2 | 3 | 4 | 5;
  if (clampedDanger !== plan.dangerLevel) flags.push(`dangerLevel clamped to ${clampedDanger}`);
  const radius = Math.max(1, plan.affectedArea.radius);
  if (radius !== plan.affectedArea.radius) flags.push('affectedArea.radius clamped to >= 1');
  const timeLimit = plan.timeLimitSeconds != null ? Math.max(10, Math.min(900, plan.timeLimitSeconds)) : undefined;

  for (const id of plan.involvedNPCIds) if (!npc.has(id)) flags.push(`unknown npc ${id}`);
  for (const id of plan.involvedObjectIds) if (!obj.has(id)) flags.push(`unknown object ${id}`);
  for (const id of plan.involvedObstacleIds ?? []) if (!obs.has(id)) flags.push(`unknown obstacle ${id}`);
  for (const id of plan.involvedDeviceIds ?? []) if (!dev.has(id)) flags.push(`unknown device ${id}`);
  for (const id of plan.involvedEnemyGroupIds ?? []) if (!eg.has(id)) flags.push(`unknown enemy group ${id}`);
  for (const id of plan.recommendedCharacterIds) if (!chars.has(id)) flags.push(`unknown character ${id}`);

  return {
    plan: { ...plan, dangerLevel: clampedDanger, affectedArea: { ...plan.affectedArea, radius }, timeLimitSeconds: timeLimit },
    flags,
  };
}
