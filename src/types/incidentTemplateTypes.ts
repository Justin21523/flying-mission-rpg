import type { IncidentType, RescueRoleTag, IncidentStateChange, IncidentObjectiveStep, IncidentSolutionDefinition } from './incidentTypes';
import type { IncidentAiControlParameters } from './aiIncidentTypes';

// An editable Incident TEMPLATE (Batch G). Templates are the reusable seed definitions the AIIncidentMockProvider
// fills with live world-state ids to produce an IncidentPlan. Edit-Mode-authorable + duplicable.

export interface IncidentTemplate {
  id: string;
  incidentType: IncidentType;
  title: string;
  description: string;

  allowedLocationIds?: string[];
  allowedZoneIds?: string[];

  dangerLevel: 1 | 2 | 3 | 4 | 5;
  recommendedCharacterIds: string[];
  requiredRescueRoles: RescueRoleTag[];

  // Template-relative ids (e.g. 'npc#0', 'obstacle#0') the provider maps onto real live ids.
  npcSlotCount: number;
  objectSlotCount: number;
  obstacleSlotCount: number;
  deviceSlotCount: number;
  enemyGroupSlotCount: number;

  defaultObjectives: IncidentObjectiveStep[];
  defaultInitialStateChanges: IncidentStateChange[];
  defaultSolutions: IncidentSolutionDefinition[];
  defaultPostSuccessStateChanges?: IncidentStateChange[];
  // Batch H — per-escalation-level state changes (worsen NPCs / spawn hazards / activate obstacles).
  defaultEscalationEffects?: IncidentStateChange[][];

  timeLimitSeconds?: number;
  aiControlParameters: IncidentAiControlParameters;

  // Batch H — NPC behavior tuning (flee/evacuate speeds, panic-spread radius). Optional; defaults applied.
  npcBehavior?: { fleeSpeed?: number; evacuateSpeed?: number; panicSpreadRadius?: number };

  editorMeta?: { authorNotes?: string; tags?: string[]; difficulty?: 'easy' | 'normal' | 'hard' };
  enabled?: boolean;
}
