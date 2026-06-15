import { useAdvancedMissionZoneStore } from '../../stores/game/useAdvancedMissionZoneStore';
import { useCombatTargetStore } from '../../stores/game/combatTargetStore';
import { getEditorZoneSegment } from '../../stores/game/editorZoneSegmentStore';

// Light, guarded bridge between the Combat Runtime and Batch A's zone progression. When the active segment
// has a `placeholder-clear-area` completion condition AND combat dummies were spawned for that area
// (target.segmentAreaId === areaId), the area is marked cleared once all those dummies are destroyed. This
// reuses Batch A's recordAreaCleared seam — it never writes zone state directly beyond that, so it can't
// break zone progression. If no dummies were spawned for the area this is a no-op (the area still clears by
// the normal Batch A placeholder rule of standing in it).
export function tickZoneCombatClear(): void {
  const z = useAdvancedMissionZoneStore.getState();
  const segId = z.activeSegmentId;
  if (!segId) return;
  const seg = getEditorZoneSegment(segId);
  if (!seg) return;
  for (const c of seg.completionConditions) {
    if (c.type !== 'placeholder-clear-area') continue;
    if (z.clearedAreaIds.includes(c.areaId)) continue;
    // Only auto-clear via combat when at least one dummy was assigned to this area (else leave Batch A's
    // proximity rule to handle it).
    if (!wasAreaPopulated(c.areaId)) continue;
    if (useCombatTargetStore.getState().liveCountForArea(c.areaId) === 0) {
      useAdvancedMissionZoneStore.getState().recordAreaCleared(c.areaId);
    }
  }
}

// Tracks which areas have had at least one combat dummy assigned (so an empty area isn't auto-cleared).
const populatedAreas = new Set<string>();
export function markAreaPopulated(areaId: string): void { populatedAreas.add(areaId); }
export function wasAreaPopulated(areaId: string): boolean { return populatedAreas.has(areaId); }
export function resetZoneCombatAdapter(): void { populatedAreas.clear(); }
