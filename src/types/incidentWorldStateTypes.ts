// The world-state snapshot the AI planner reads + validation checks against (Batch G). Captures every id the
// AI is ALLOWED to reference — the planner/LLM may never invent ids outside this snapshot.

export interface IncidentWorldStateSnapshot {
  locationId: string;
  zoneId?: string;
  segmentId?: string;
  npcIds: string[];
  objectIds: string[];
  obstacleIds: string[];
  deviceIds: string[];
  enemyGroupIds: string[];
  markerIds: string[];
  safeAreaIds: string[];
  availableCharacterIds: string[];
  availableSupportAbilityTypes: string[];
  existingZoneConditionIds: string[];
}
