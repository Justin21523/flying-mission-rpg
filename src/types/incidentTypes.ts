// AI Incident system — shared base types (Batch G). DISTINCT from the legacy POLI incident system
// (src/types/incident.ts). An AI/mock provider emits an IncidentPlan (aiIncidentTypes.ts) built from these
// pieces; deterministic game logic validates + applies it. Nothing here mutates state.

export type IncidentType =
  | 'road-accident'
  | 'fire-event'
  | 'mechanical-failure'
  | 'npc-trapped'
  | 'building-damaged'
  | 'bridge-collapse'
  | 'flood-or-leak'
  | 'power-outage'
  | 'traffic-chaos'
  | 'high-place-rescue'
  | 'medical-rescue'
  | 'multi-stage-composite';

export const INCIDENT_TYPES: readonly IncidentType[] = [
  'road-accident', 'fire-event', 'mechanical-failure', 'npc-trapped', 'building-damaged',
  'bridge-collapse', 'flood-or-leak', 'power-outage', 'traffic-chaos', 'high-place-rescue',
  'medical-rescue', 'multi-stage-composite',
];

export type RescueRoleTag =
  | 'traffic-control'
  | 'fire-rescue'
  | 'medical'
  | 'air-rescue'
  | 'repair'
  | 'engineering'
  | 'scan'
  | 'shield'
  | 'combat'
  | 'evacuation'
  | 'heavy-break';

export const RESCUE_ROLE_TAGS: readonly RescueRoleTag[] = [
  'traffic-control', 'fire-rescue', 'medical', 'air-rescue', 'repair', 'engineering',
  'scan', 'shield', 'combat', 'evacuation', 'heavy-break',
];

export type IncidentNpcChange =
  | 'set-trapped' | 'set-panicked' | 'set-injured' | 'set-waiting-rescue'
  | 'set-evacuating' | 'set-safe' | 'set-dialogue-hint';
export type IncidentObjectChange =
  | 'set-damaged' | 'set-blocking-path' | 'set-burning' | 'set-flooded'
  | 'set-broken' | 'set-repaired' | 'set-disabled' | 'set-active';
export type IncidentObstacleChange =
  | 'activate' | 'damage' | 'destroy' | 'clear' | 'lock' | 'unlock' | 'repair';
export type IncidentEnvironmentChange =
  | 'spawn-smoke' | 'spawn-fire-placeholder' | 'spawn-flood-placeholder' | 'spawn-electric-hazard'
  | 'block-route' | 'open-route' | 'set-danger-zone' | 'clear-danger-zone';

export const INCIDENT_NPC_CHANGES: readonly IncidentNpcChange[] = ['set-trapped', 'set-panicked', 'set-injured', 'set-waiting-rescue', 'set-evacuating', 'set-safe', 'set-dialogue-hint'];
export const INCIDENT_OBJECT_CHANGES: readonly IncidentObjectChange[] = ['set-damaged', 'set-blocking-path', 'set-burning', 'set-flooded', 'set-broken', 'set-repaired', 'set-disabled', 'set-active'];
export const INCIDENT_OBSTACLE_CHANGES: readonly IncidentObstacleChange[] = ['activate', 'damage', 'destroy', 'clear', 'lock', 'unlock', 'repair'];
export const INCIDENT_ENVIRONMENT_CHANGES: readonly IncidentEnvironmentChange[] = ['spawn-smoke', 'spawn-fire-placeholder', 'spawn-flood-placeholder', 'spawn-electric-hazard', 'block-route', 'open-route', 'set-danger-zone', 'clear-danger-zone'];

export type IncidentStateChange =
  | { id?: string; targetType: 'npc'; targetId: string; change: IncidentNpcChange; value?: unknown }
  | { id?: string; targetType: 'object'; targetId: string; change: IncidentObjectChange; value?: unknown }
  | { id?: string; targetType: 'obstacle'; targetId: string; change: IncidentObstacleChange; value?: unknown }
  | { id?: string; targetType: 'environment'; targetId: string; change: IncidentEnvironmentChange; value?: unknown };

export type IncidentStateChangeTargetType = IncidentStateChange['targetType'];
export const INCIDENT_TARGET_TYPES: readonly IncidentStateChangeTargetType[] = ['npc', 'object', 'obstacle', 'environment'];

export type IncidentObjectiveType =
  | 'reach-area' | 'interact-object' | 'rescue-npc' | 'evacuate-npc' | 'repair-device'
  | 'clear-obstacle' | 'extinguish-fire-placeholder' | 'stabilize-npc' | 'scan-target'
  | 'defeat-enemy-group' | 'protect-area' | 'complete-zone-condition';

export const INCIDENT_OBJECTIVE_TYPES: readonly IncidentObjectiveType[] = [
  'reach-area', 'interact-object', 'rescue-npc', 'evacuate-npc', 'repair-device', 'clear-obstacle',
  'extinguish-fire-placeholder', 'stabilize-npc', 'scan-target', 'defeat-enemy-group', 'protect-area', 'complete-zone-condition',
];

export type IncidentCondition =
  | { type: 'npc-state'; npcId: string; state: string }
  | { type: 'object-state'; objectId: string; state: string }
  | { type: 'obstacle-state'; obstacleId: string; state: string }
  | { type: 'device-repaired'; deviceId: string }
  | { type: 'enemy-group-cleared'; enemyGroupId: string }
  | { type: 'zone-condition-complete'; conditionId: string }
  | { type: 'player-reached-area'; areaId: string; radius: number }
  | { type: 'timer-expired'; seconds: number }
  | { type: 'support-used'; supportAbilityId: string }
  | { type: 'character-skill-used'; skillId: string; targetId?: string }
  | { type: 'debug-complete' };

export type IncidentConditionType = IncidentCondition['type'];

export interface IncidentObjectiveStep {
  id: string;
  label: string;
  description?: string;
  objectiveType: IncidentObjectiveType;
  targetId?: string;
  targetType?: 'npc' | 'object' | 'obstacle' | 'device' | 'enemy-group' | 'area';
  requiredRoleTags?: RescueRoleTag[];
  recommendedCharacterIds?: string[];
  completionConditions: IncidentCondition[];
  optional: boolean;
  order: number;
  uiHint?: string;
}

export type IncidentSolutionType =
  | 'character-skill' | 'support-ability' | 'manual-interaction' | 'combat'
  | 'repair' | 'scan' | 'evacuation' | 'multi-step';

export const INCIDENT_SOLUTION_TYPES: readonly IncidentSolutionType[] = [
  'character-skill', 'support-ability', 'manual-interaction', 'combat', 'repair', 'scan', 'evacuation', 'multi-step',
];

export interface IncidentSolutionDefinition {
  id: string;
  label: string;
  description: string;
  solutionType: IncidentSolutionType;
  requiredCharacterIds?: string[];
  requiredRoleTags?: RescueRoleTag[];
  requiredSkillTags?: string[];
  requiredSupportAbilityTypes?: string[];
  targetIds: string[];
  expectedStateChanges: IncidentStateChange[];
  risk?: { canFail: boolean; failureReason?: string; timePenaltySeconds?: number; dangerIncrease?: number };
  editorMeta?: { notes?: string };
}
