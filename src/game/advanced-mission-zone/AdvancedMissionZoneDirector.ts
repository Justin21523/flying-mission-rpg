import { useGameStore } from '../../stores/game/useGameStore';
import { useAdvancedMissionZoneStore } from '../../stores/game/useAdvancedMissionZoneStore';
import { getEditorMissionZone } from '../../stores/game/editorMissionZoneStore';
import { getSegmentsForZone, getEditorZoneSegment } from '../../stores/game/editorZoneSegmentStore';
import type { MissionZoneDefinition, ZoneSegmentDefinition } from '../../types/game/advancedMissionZone';
import { isFinalSegment } from './zoneProgress';
import { runIncidentHooks } from './IncidentZoneHookAdapter';

// Orchestrates the Advanced Mission Zone flow over the runtime store + game FSM. Pure-ish: it mutates the
// stores through their actions (like SupportDispatchDirector) and never holds React state. The Host drives
// the per-frame evaluation; this module owns the phase/segment transitions.

export function activeZone(): MissionZoneDefinition | undefined {
  const id = useAdvancedMissionZoneStore.getState().activeZoneId;
  return id ? getEditorMissionZone(id) : undefined;
}

export function activeSegment(): ZoneSegmentDefinition | undefined {
  const id = useAdvancedMissionZoneStore.getState().activeSegmentId;
  return id ? getEditorZoneSegment(id) : undefined;
}

// Set up runtime for a zone. Does NOT change phase — the caller (LandingSettle) transitions to
// ADVANCED_MISSION_ZONE. Returns false if the zone has no usable segments (caller falls back to legacy).
export function startMissionZone(zoneId: string, nowMs?: number): boolean {
  const zone = getEditorMissionZone(zoneId);
  if (!zone) return false;
  const segments = getSegmentsForZone(zoneId).filter((s) => s.enabled);
  if (segments.length === 0) return false;
  const start = segments.find((s) => s.id === zone.startSegmentId) ?? segments[0];
  useAdvancedMissionZoneStore.getState().startZone(zone.id, start.id, segments.map((s) => s.id), nowMs);
  runIncidentHooks(zone.aiIncidentHooks?.onZoneStart, { zoneId });
  return true;
}

// Called while in ADVANCED_MISSION_ZONE: enter the start segment and begin gameplay.
export function beginFirstSegment(): void {
  const store = useAdvancedMissionZoneStore.getState();
  if (!store.activeSegmentId) return;
  const seg = getEditorZoneSegment(store.activeSegmentId);
  store.enterSegment(store.activeSegmentId);
  if (seg) runIncidentHooks(seg.aiIncidentHooks?.onSegmentEnter, { segmentId: seg.id });
  useGameStore.getState().requestTransition('ZONE_SEGMENT_GAMEPLAY');
}

// Mark the active segment complete, unlock next, and move to the ZONE_COMPLETE toast phase.
export function completeCurrentSegment(): void {
  const store = useAdvancedMissionZoneStore.getState();
  const seg = activeSegment();
  if (!seg) return;
  store.markSegmentComplete(seg.id);
  store.setPendingNext(seg.nextSegmentIds);
  for (const nid of seg.nextSegmentIds) store.unlockSegment(nid);
  runIncidentHooks(seg.aiIncidentHooks?.onSegmentComplete, { segmentId: seg.id });
  if (useGameStore.getState().phase === 'ZONE_SEGMENT_GAMEPLAY') {
    useGameStore.getState().requestTransition('ZONE_COMPLETE');
  }
}

// Called while in ZONE_COMPLETE (after the toast): advance to the next segment or finish the mission.
export function transitionToNextSegment(): void {
  const zone = activeZone();
  const store = useAdvancedMissionZoneStore.getState();
  const last = store.lastCompletedSegmentId ? getEditorZoneSegment(store.lastCompletedSegmentId) : undefined;
  if (zone && last && isFinalSegment(zone, last)) {
    completeMissionZone();
    return;
  }
  const nextId = store.pendingNextSegmentIds[0];
  const next = nextId ? getEditorZoneSegment(nextId) : undefined;
  if (!next) {
    completeMissionZone();
    return;
  }
  store.enterSegment(next.id);
  runIncidentHooks(next.aiIncidentHooks?.onSegmentEnter, { segmentId: next.id });
  if (useGameStore.getState().phase === 'ZONE_COMPLETE') {
    useGameStore.getState().requestTransition('ZONE_SEGMENT_GAMEPLAY');
  }
}

export function completeMissionZone(): void {
  const zone = activeZone();
  useAdvancedMissionZoneStore.getState().completeZone();
  if (zone) runIncidentHooks(zone.aiIncidentHooks?.onZoneComplete, { zoneId: zone.id });
  const phase = useGameStore.getState().phase;
  if (phase === 'ZONE_COMPLETE' || phase === 'ZONE_SEGMENT_GAMEPLAY') {
    useGameStore.getState().requestTransition('MISSION_COMPLETE');
  }
}

// Safety fallback if a zone fails to load: go to the legacy NPC flow.
export function fallbackToLegacyMissionGameplay(): void {
  useAdvancedMissionZoneStore.getState().resetZone();
  if (useGameStore.getState().phase === 'ADVANCED_MISSION_ZONE') {
    useGameStore.getState().requestTransition('NPC_GREETING');
  }
}

// ---- debug ----

export function debugCompleteCurrentSegment(): void {
  if (useGameStore.getState().phase === 'ZONE_SEGMENT_GAMEPLAY') completeCurrentSegment();
}

export function debugJumpToSegment(segmentId: string): void {
  const seg = getEditorZoneSegment(segmentId);
  const store = useAdvancedMissionZoneStore.getState();
  if (!seg || seg.zoneId !== store.activeZoneId) return;
  store.unlockSegment(segmentId);
  store.enterSegment(segmentId);
  // Dev jump bypasses FSM validation so it works from any zone phase.
  useGameStore.getState().jumpTo('ZONE_SEGMENT_GAMEPLAY');
}

export function debugUnlockAllSegments(): void {
  const store = useAdvancedMissionZoneStore.getState();
  if (!store.activeZoneId) return;
  for (const s of getSegmentsForZone(store.activeZoneId)) store.unlockSegment(s.id);
}
