import { useAdvancedMissionZoneStore } from '../../stores/game/useAdvancedMissionZoneStore';

// Translates support-ability outcomes into Advanced Mission Zone progress (Batch E). Goes through the zone
// store's public `recordSupportEvent` / `addProtectedAreaSeconds` seams only — never completes a condition
// directly. The zone probe reads these recorded sets; the evaluator decides completion.

export type SupportZoneEventKind =
  | 'use-support-ability'
  | 'support-repair-device'
  | 'support-clear-obstacle'
  | 'support-scan-target';

export type SupportEventRecorder = (kind: SupportZoneEventKind, id: string) => void;

const defaultRecord: SupportEventRecorder = (kind, id) => useAdvancedMissionZoneStore.getState().recordSupportEvent(kind, id);

export interface SupportOutcomeForZone {
  abilityId: string;
  primaryTargetId?: string;
  repairedDeviceIds: string[];
  clearedObstacleIds: string[];
  scannedTargetIds: string[];
}

// Record every zone-relevant event from a support ability's outcome. Pure when a recorder is injected.
export function recordSupportOutcome(o: SupportOutcomeForZone, record: SupportEventRecorder = defaultRecord): void {
  record('use-support-ability', o.abilityId);
  if (o.primaryTargetId) record('use-support-ability', `${o.abilityId}:${o.primaryTargetId}`);
  for (const id of o.repairedDeviceIds) record('support-repair-device', id);
  for (const id of o.clearedObstacleIds) record('support-clear-obstacle', id);
  for (const id of o.scannedTargetIds) record('support-scan-target', id);
}

export function addProtectedAreaSeconds(areaId: string, seconds: number): void {
  useAdvancedMissionZoneStore.getState().addProtectedAreaSeconds(areaId, seconds);
}
