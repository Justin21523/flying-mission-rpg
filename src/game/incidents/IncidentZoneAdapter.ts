import { useAdvancedMissionZoneStore } from '../../stores/game/useAdvancedMissionZoneStore';

// Records incident outcomes back into the Advanced Mission Zone store (Batch G §8) so resolve-incident /
// complete-incident-objective / incident-success / incident-failed zone conditions complete. Mirrors
// SupportZoneConditionAdapter / BossZoneConditionAdapter — the incident director never touches the zone store
// directly except through here.
export function recordIncidentObjectiveComplete(incidentId: string, objectiveStepId: string): void {
  useAdvancedMissionZoneStore.getState().recordIncidentEvent('complete-incident-objective', `${incidentId}:${objectiveStepId}`);
}

export function recordIncidentResolved(incidentId: string): void {
  const z = useAdvancedMissionZoneStore.getState();
  z.recordIncidentEvent('resolve-incident', incidentId);
  z.recordIncidentEvent('incident-success', incidentId);
}

export function recordIncidentFailed(incidentId: string): void {
  useAdvancedMissionZoneStore.getState().recordIncidentEvent('incident-failed', incidentId);
}
