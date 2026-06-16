import type { IncidentWorldStateSnapshot } from '../../../types/incidentWorldStateTypes';
import { INCIDENT_TYPES, INCIDENT_NPC_CHANGES, INCIDENT_OBJECT_CHANGES, INCIDENT_OBSTACLE_CHANGES, INCIDENT_ENVIRONMENT_CHANGES, RESCUE_ROLE_TAGS } from '../../../types/incidentTypes';

// Builds the constrained prompt context for a FUTURE LLM provider (Batch G §16.1). The LLM may ONLY reference
// ids/types listed here and must output IncidentPlan JSON — it can never invent ids. Pure string builder; not
// required for the mock path but kept so the LLM seam is ready.
export interface IncidentPromptContext {
  system: string;
  user: string;
}

export function buildIncidentPrompt(world: IncidentWorldStateSnapshot, opts?: { maxObjectives?: number; maxDangerLevel?: number }): IncidentPromptContext {
  const maxObjectives = opts?.maxObjectives ?? 6;
  const maxDangerLevel = opts?.maxDangerLevel ?? 5;
  const system = [
    'You are an incident designer for a kids rescue game. Output ONLY a single JSON IncidentPlan object.',
    'You MUST only reference ids from the allowed lists. Never invent ids. Never output code or prose.',
    `Max ${maxObjectives} objective steps. dangerLevel 1..${maxDangerLevel}. Every objective needs completionConditions.`,
    'Provide at least 2 availableSolutions so no single character is mandatory.',
  ].join('\n');
  const user = JSON.stringify({
    world: {
      locationId: world.locationId, zoneId: world.zoneId, segmentId: world.segmentId,
      allowedNpcIds: world.npcIds, allowedObjectIds: world.objectIds, allowedObstacleIds: world.obstacleIds,
      allowedDeviceIds: world.deviceIds, allowedEnemyGroupIds: world.enemyGroupIds, allowedMarkerIds: world.markerIds,
      allowedSafeAreaIds: world.safeAreaIds, allowedCharacterIds: world.availableCharacterIds,
      allowedSupportAbilityTypes: world.availableSupportAbilityTypes, existingZoneConditionIds: world.existingZoneConditionIds,
    },
    allowedIncidentTypes: INCIDENT_TYPES,
    allowedRoleTags: RESCUE_ROLE_TAGS,
    allowedStateChanges: { npc: INCIDENT_NPC_CHANGES, object: INCIDENT_OBJECT_CHANGES, obstacle: INCIDENT_OBSTACLE_CHANGES, environment: INCIDENT_ENVIRONMENT_CHANGES },
    outputSchema: 'IncidentPlan (see types/aiIncidentTypes.ts)',
  }, null, 2);
  return { system, user };
}
