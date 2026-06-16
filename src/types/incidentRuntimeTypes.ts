import type { IncidentReplayEvent } from './incidentReplayTypes';

// Runtime state of the active incident (Batch G). Mutated only by the incident runtime modules through the
// runtime store actions; React UI reads it.

export type IncidentRuntimeStatus =
  | 'inactive'
  | 'planning'
  | 'validation-failed'
  | 'ready'
  | 'applying'
  | 'active'
  | 'escalating'
  | 'success'
  | 'failed'
  | 'cancelled'
  | 'completed';

export const INCIDENT_RUNTIME_STATUSES: readonly IncidentRuntimeStatus[] = [
  'inactive', 'planning', 'validation-failed', 'ready', 'applying', 'active',
  'escalating', 'success', 'failed', 'cancelled', 'completed',
];

export interface IncidentRuntimeDebug {
  forceComplete: boolean;
  freezeEscalation: boolean;
  showAffectedArea: boolean;
  showStateChanges: boolean;
}

export interface IncidentRuntimeState {
  activeIncidentId?: string;
  activeTemplateId?: string;

  status: IncidentRuntimeStatus;

  currentStageIndex: number;

  completedObjectiveStepIds: string[];
  failedObjectiveStepIds: string[];

  appliedStateChangeIds: string[];

  dangerLevel: number;

  startedAt?: number;
  updatedAt?: number;
  completedAt?: number;

  timeRemainingSeconds?: number;

  currentEscalationLevel: number;

  replayEvents: IncidentReplayEvent[];

  validationErrors: string[];

  debug: IncidentRuntimeDebug;
}
