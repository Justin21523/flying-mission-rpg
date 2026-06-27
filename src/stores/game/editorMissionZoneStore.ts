import { nanoid } from 'nanoid';
import { createEditorCollection } from './createEditorCollection';
import type { MissionZoneDefinition } from '../../types/game/advancedMissionZone';
import { SEED_MISSION_ZONES } from '../../data/game/advancedMissionZones';

// Editable Advanced Mission Zone definitions (🎯 Mission Zone tab). Segments live in their own collection
// (editorZoneSegmentStore) keyed by zoneId; this store holds the zone-level data + authored order.
export const useEditorMissionZoneStore = createEditorCollection<MissionZoneDefinition>({
  storageKey: 'aero-rescue-editor-mission-zone-v1',
  seed: SEED_MISSION_ZONES,
  makeId: () => `mz_${nanoid(6)}`,
  // Batch J/K — bump so reconcileFromSeed refreshes shipped zones (autoCombatOnLanding + randomBossPoolId +
  // zone environmentThemeId across all zones) on existing saves, while keeping user-authored zones.
  seedVersion: 'batch-j-2',
});

export function getEditorMissionZones(): MissionZoneDefinition[] {
  return useEditorMissionZoneStore.getState().items;
}

export function getEditorMissionZone(id: string): MissionZoneDefinition | undefined {
  return useEditorMissionZoneStore.getState().items.find((z) => z.id === id);
}

// The enabled zone that owns a location's landing area (drives LANDING → ADVANCED_MISSION_ZONE routing).
export function getMissionZoneForLocation(locationId: string | null | undefined): MissionZoneDefinition | undefined {
  if (!locationId) return undefined;
  return useEditorMissionZoneStore.getState().items.find((z) => z.enabled && z.locationId === locationId);
}
