import type {
  IncidentType, RescueRoleTag, IncidentStateChange, IncidentObjectiveStep,
  IncidentCondition, IncidentSolutionDefinition,
} from './incidentTypes';

// The IncidentPlan — the ONLY thing an AI/mock provider may output (Batch G). It must pass IncidentValidation
// before any deterministic game logic applies it; the provider never mutates state or runs code.

export interface IncidentAiControlParameters {
  allowEscalation: boolean;
  escalationIntervalSeconds?: number;
  maxEscalationLevel?: number;
  allowNPCStateChanges: boolean;
  allowObjectStateChanges: boolean;
  allowEnvironmentStateChanges: boolean;
}

export interface IncidentPlan {
  incidentId: string;
  templateId?: string;

  incidentType: IncidentType;

  locationId: string;
  zoneId?: string;
  segmentId?: string;

  title: string;
  description: string;

  involvedNPCIds: string[];
  involvedObjectIds: string[];
  involvedObstacleIds?: string[];
  involvedDeviceIds?: string[];
  involvedEnemyGroupIds?: string[];

  affectedArea: { areaId?: string; center: [number, number, number]; radius: number };

  dangerLevel: 1 | 2 | 3 | 4 | 5;

  recommendedCharacterIds: string[];
  requiredRescueRoles: RescueRoleTag[];

  initialStateChanges: IncidentStateChange[];

  objectiveSteps: IncidentObjectiveStep[];

  successConditions: IncidentCondition[];
  failureConditions: IncidentCondition[];

  timeLimitSeconds?: number;

  availableSolutions: IncidentSolutionDefinition[];

  aiControlParameters: IncidentAiControlParameters;

  postSuccessStateChanges?: IncidentStateChange[];
  postFailureStateChanges?: IncidentStateChange[];

  // Batch H — per-escalation-level state changes (index 0 = effect at escalation level 1). Applied
  // deterministically by IncidentEscalationController when the incident escalates.
  escalationEffects?: IncidentStateChange[][];

  editorMeta?: {
    generatedBy: 'llm' | 'mock' | 'manual' | 'template';
    authorNotes?: string;
    tags?: string[];
    difficulty?: 'easy' | 'normal' | 'hard';
  };
}

export type IncidentPlanProviderMode = 'mock' | 'template-random' | 'manual-json' | 'future-llm';
