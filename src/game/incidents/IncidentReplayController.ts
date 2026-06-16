import type { IncidentReplayData } from '../../types/incidentReplayTypes';
import { useIncidentRuntimeStore } from '../../stores/useIncidentRuntimeStore';
import { applyInitialStateChanges } from './IncidentApplicationController';

// Incident replay (Batch G §7, §17). Replay is lightweight: re-apply the plan's initial state changes + surface
// the recorded event log (objectives/escalation/result). It does NOT re-simulate player input.
export interface ReplayPlayback {
  data: IncidentReplayData;
  reapplied: boolean;
}

export function replayIncident(data: IncidentReplayData): ReplayPlayback {
  const rt = useIncidentRuntimeStore.getState();
  // Load the plan back into the runtime store + re-apply its initial state changes so the world shows the setup.
  rt.setPlan(data.plan);
  rt.patch({ activeIncidentId: data.plan.incidentId, status: 'active', startedAt: Date.now(), currentEscalationLevel: 0 });
  applyInitialStateChanges(data.plan);
  return { data, reapplied: true };
}

export function replaySavedAt(index: number): ReplayPlayback | undefined {
  const data = useIncidentRuntimeStore.getState().savedReplays[index];
  return data ? replayIncident(data) : undefined;
}
