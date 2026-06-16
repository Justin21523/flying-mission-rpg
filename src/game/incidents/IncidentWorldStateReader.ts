import type { IncidentWorldStateSnapshot } from '../../types/incidentWorldStateTypes';
import { useAdvancedMissionZoneStore } from '../../stores/game/useAdvancedMissionZoneStore';
import { activeSegment } from '../advanced-mission-zone/AdvancedMissionZoneDirector';
import { liveObstacles } from '../../stores/game/obstacleStore';

// Reads the live world into the snapshot of ids the AI is ALLOWED to reference (Batch G §7.4). Real entities
// (obstacles/devices/enemy-groups/markers) come from the active zone segment + live directors; NPCs/objects/
// areas are incident-owned virtual ids exposed as an allowed placeholder pool (§0.11).
const HERO_IDS = ['char_jett', 'char_jerome', 'char_paul', 'char_donnie', 'char_todd', 'char_flip', 'char_bello', 'char_chase'];
const SUPPORT_TYPES = ['strike-support', 'shield-support', 'repair-support', 'scan-support', 'taunt-support', 'break-support'];

// Allowed incident-owned placeholder ids (always available so a template's npc/object/area slots can bind).
export const INCIDENT_NPC_SLOTS = ['incident_npc_0', 'incident_npc_1', 'incident_npc_2'];
export const INCIDENT_OBJECT_SLOTS = ['incident_object_0', 'incident_object_1'];
export const INCIDENT_AREA_ID = 'incident_area_main';
export const INCIDENT_OBSTACLE_FALLBACK = 'incident_obstacle_0';
export const INCIDENT_DEVICE_FALLBACK = 'incident_device_0';
export const INCIDENT_ENEMY_FALLBACK = 'incident_enemy_0';

export function readIncidentWorldState(locationId = 'loc_sunny_harbor'): IncidentWorldStateSnapshot {
  const z = useAdvancedMissionZoneStore.getState();
  const seg = activeSegment();
  const liveObstacleIds = liveObstacles.map((o) => o.id);
  const segObstacleIds = seg?.placeholderObstacleIds ?? [];
  const obstacleIds = [...new Set([...segObstacleIds, ...liveObstacleIds, INCIDENT_OBSTACLE_FALLBACK])];
  // Devices are a subtype of obstacle; expose the authored obstacle ids + a fallback so repair objectives bind.
  const deviceIds = [...new Set([...segObstacleIds, ...liveObstacleIds, INCIDENT_DEVICE_FALLBACK])];
  return {
    locationId,
    zoneId: z.activeZoneId,
    segmentId: z.activeSegmentId,
    npcIds: [...INCIDENT_NPC_SLOTS],
    objectIds: [...INCIDENT_OBJECT_SLOTS, INCIDENT_AREA_ID],
    obstacleIds,
    deviceIds,
    enemyGroupIds: [...new Set([...(seg?.placeholderEnemyGroupIds ?? []), INCIDENT_ENEMY_FALLBACK])],
    markerIds: (seg?.markers ?? []).map((m) => m.id),
    safeAreaIds: [INCIDENT_AREA_ID, ...(seg?.markers ?? []).map((m) => m.id)],
    availableCharacterIds: [...HERO_IDS],
    availableSupportAbilityTypes: [...SUPPORT_TYPES],
    existingZoneConditionIds: (seg?.completionConditions ?? []).map((c) => c.id),
  };
}
