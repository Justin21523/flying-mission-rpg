import type { IncidentEnvironmentChange } from '../../types/incidentTypes';
import { useIncidentHazardStore, type IncidentHazardKind } from '../../stores/useIncidentHazardStore';
import { setObjectState } from './IncidentObjectStateController';

// Applies environment hazard PLACEHOLDERS for an incident (Batch G §7.6) through the incident hazard store.
// Smoke/fire/flood/electric/danger-zone are simple visual+gameplay markers (no real physics).
const SPAWN_KIND: Partial<Record<IncidentEnvironmentChange, IncidentHazardKind>> = {
  'spawn-smoke': 'smoke', 'spawn-fire-placeholder': 'fire', 'spawn-flood-placeholder': 'flood',
  'spawn-electric-hazard': 'electric', 'set-danger-zone': 'danger-zone', 'block-route': 'route-block', 'open-route': 'route-open',
};

export function applyEnvChange(areaId: string, change: IncidentEnvironmentChange, center: [number, number, number], radius = 10): void {
  const store = useIncidentHazardStore.getState();
  if (change === 'clear-danger-zone') {
    // Deactivate every hazard tied to this area + mark the area "cleared" so extinguish objectives resolve.
    for (const h of Object.values(store.hazards)) if (h.areaId === areaId) store.setActive(h.id, false);
    setObjectState(areaId, 'cleared', center);
    return;
  }
  const kind = SPAWN_KIND[change];
  if (!kind) return;
  store.setHazard(`${areaId}_${kind}`, { kind, areaId, center, radius, active: kind !== 'route-open' });
}

// Player resolved the hazard at an area (e.g. reached + extinguished) — deactivate fire/smoke, mark area cleared.
export function extinguishArea(areaId: string, center: [number, number, number]): void {
  const store = useIncidentHazardStore.getState();
  for (const h of Object.values(store.hazards)) if (h.areaId === areaId && (h.kind === 'fire' || h.kind === 'smoke')) store.setActive(h.id, false);
  setObjectState(areaId, 'cleared', center);
}

export function cleanupIncidentHazards(): void {
  useIncidentHazardStore.getState().clearAll();
}
