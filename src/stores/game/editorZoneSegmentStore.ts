import { nanoid } from 'nanoid';
import { createEditorCollection } from './createEditorCollection';
import type { ZoneSegmentDefinition } from '../../types/game/advancedMissionZone';
import { SEED_ZONE_SEGMENTS } from '../../data/game/advancedMissionZones';

// Editable Zone Segments (🎯 Mission Zone tab). Each segment carries `zoneId`; conditions + markers are
// nested inside the segment object and edited inline.
export const useEditorZoneSegmentStore = createEditorCollection<ZoneSegmentDefinition>({
  storageKey: 'aero-rescue-editor-zone-segment-v1',
  seed: SEED_ZONE_SEGMENTS,
  makeId: () => `seg_${nanoid(6)}`,
  // Batch J/K/O + World-build W1/W2 — bump so reconcileFromSeed refreshes shipped segments (auto-combat landing,
  // env themes, mission-type conversions, W1 Signal Yard, and the W2 incident hooks on 9 segments) on saves.
  seedVersion: 'worldbuild-w2',
});

export function getEditorZoneSegments(): ZoneSegmentDefinition[] {
  return useEditorZoneSegmentStore.getState().items;
}

export function getEditorZoneSegment(id: string): ZoneSegmentDefinition | undefined {
  return useEditorZoneSegmentStore.getState().items.find((s) => s.id === id);
}

// Segments belonging to a zone, in authored `order`.
export function getSegmentsForZone(zoneId: string): ZoneSegmentDefinition[] {
  return useEditorZoneSegmentStore
    .getState()
    .items.filter((s) => s.zoneId === zoneId)
    .sort((a, b) => a.order - b.order);
}
