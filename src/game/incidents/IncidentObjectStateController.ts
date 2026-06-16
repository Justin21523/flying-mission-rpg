import type { IncidentObjectChange } from '../../types/incidentTypes';
import { useIncidentObjectStateStore, type IncidentObjectState } from '../../stores/useIncidentObjectStateStore';

// Applies object state changes for incident-owned virtual objects (Batch G §7.6). Real obstacles/devices are
// handled by IncidentApplicationController via ObstacleDirector; this covers generic objects + the area "object"
// (e.g. a danger zone that gets 'cleared').
const CHANGE_TO_STATE: Record<IncidentObjectChange, IncidentObjectState> = {
  'set-damaged': 'damaged', 'set-blocking-path': 'blocking-path', 'set-burning': 'burning', 'set-flooded': 'flooded',
  'set-broken': 'broken', 'set-repaired': 'repaired', 'set-disabled': 'disabled', 'set-active': 'active',
};

export function applyObjectChange(objectId: string, change: IncidentObjectChange, center: [number, number, number]): void {
  const store = useIncidentObjectStateStore.getState();
  store.setObject(objectId, { state: CHANGE_TO_STATE[change], position: store.objects[objectId]?.position ?? center });
}

// Directly set a virtual object/area state (used by the objective runtime, e.g. 'cleared' on extinguish).
export function setObjectState(objectId: string, state: IncidentObjectState, center: [number, number, number]): void {
  const store = useIncidentObjectStateStore.getState();
  store.setObject(objectId, { state, position: store.objects[objectId]?.position ?? center });
}

export function cleanupIncidentObjects(): void {
  useIncidentObjectStateStore.getState().clearAll();
}
