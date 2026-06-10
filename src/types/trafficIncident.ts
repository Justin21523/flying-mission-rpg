import type { Vec3Tuple } from './path';
import type { SurfaceType } from './surface';

// Phase A (data model) — richer, process-driven traffic incidents (breakdown / cargo-drop / controlled
// collision / signal failure …) that the Incident Director stages over a TIMELINE on the road network. This is
// DISTINCT from the existing rescue IncidentDefinition (types/incident.ts); Phase F's director bridges both.
// Nothing here runs yet.
export type IncidentCategory =
  | 'collision' | 'breakdown' | 'brakeFailure' | 'cargoDrop' | 'signalFailure'
  | 'roadBlock' | 'overheat' | 'stuck' | 'hazard' | 'rescue' | 'custom';
export const INCIDENT_CATEGORIES: IncidentCategory[] = [
  'collision', 'breakdown', 'brakeFailure', 'cargoDrop', 'signalFailure', 'roadBlock', 'overheat', 'stuck', 'hazard', 'rescue', 'custom',
];

export type IncidentTriggerMode = 'scheduled' | 'randomWeighted' | 'conditionBased' | 'scripted';

// How an NPC near an incident behaves.
export type IncidentReaction =
  | 'ignore' | 'stopAndLook' | 'moveAway' | 'panic' | 'callRescue'
  | 'helpVictim' | 'blockArea' | 'warnOthers' | 'reroute';
export const INCIDENT_REACTIONS: IncidentReaction[] = [
  'ignore', 'stopAndLook', 'moveAway', 'panic', 'callRescue', 'helpVictim', 'blockArea', 'warnOthers', 'reroute',
];

// One staged action in an incident (setup / timeline / cleanup).
export type IncidentAction =
  | { type: 'spawnVehicle'; vehicleType?: string; atNodeId?: string; pathId?: string }
  | { type: 'setVehicleState'; participant: string; state: 'normal' | 'distracted' | 'brakeFailure' | 'breakdown' | 'overheat' | 'stopped' }
  | { type: 'spawnObstacle'; obstacleId: string; position?: Vec3Tuple }
  | { type: 'blockRoad'; pathId: string; partial: boolean }
  | { type: 'npcReaction'; npcSelector: string; reaction: IncidentReaction }
  | { type: 'notifyRescue' }
  | { type: 'playAnimation'; participant: string; animationId: string }
  | { type: 'emitEvent'; event: string }
  | { type: 'wait'; seconds: number };

export interface IncidentTimelineStep { atSeconds: number; actions: IncidentAction[] }

export type IncidentResolutionCondition =
  | { type: 'victimRescued' }
  | { type: 'timeout'; seconds: number }
  | { type: 'flagSet'; flag: string }
  | { type: 'playerReached'; radius: number };

export interface IncidentScenarioDefinition {
  id: string;
  name: string;
  enabled: boolean;
  category: IncidentCategory;
  severity: number;            // 1–5

  requiredLocationTags: string[];
  blockedLocationTags?: string[];

  minParticipants: number;
  maxParticipants: number;
  allowedVehicleTypes?: string[];
  allowedNpcTypes?: string[];

  requiredPathTypes?: string[];
  allowedSurfaceTypes?: SurfaceType[];

  minWorldTime?: number;
  maxWorldTime?: number;
  weatherConditions?: string[];

  cooldown: number;
  globalCooldown: number;
  maxConcurrentInstances: number;

  triggerMode: IncidentTriggerMode;
  weight: number;

  rescueIncidentId?: string;   // notifyRescue → spawn this existing rescue IncidentDefinition (by id)

  setupActions: IncidentAction[];
  timeline: IncidentTimelineStep[];
  resolutionConditions: IncidentResolutionCondition[];
  cleanupActions: IncidentAction[];
}
