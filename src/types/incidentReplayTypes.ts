import type { IncidentPlan } from './aiIncidentTypes';

// Incident replay data (Batch G). A lightweight event log — enough to re-apply initial state changes and
// re-show how the incident progressed/resolved, NOT a full input recording.

export type IncidentReplayEventType =
  | 'incident-started'
  | 'state-change-applied'
  | 'objective-completed'
  | 'objective-failed'
  | 'escalation'
  | 'player-action'
  | 'success'
  | 'failed'
  | 'cancelled';

export interface IncidentReplayEvent {
  t: number; // ms since incident start
  type: IncidentReplayEventType;
  detail?: string;
  targetId?: string;
  value?: number;
}

export interface IncidentReplayData {
  incidentId: string;
  plan: IncidentPlan;
  events: IncidentReplayEvent[];
  finalStatus: string;
  durationMs: number;
}
