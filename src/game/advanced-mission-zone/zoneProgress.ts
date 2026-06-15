import type { MissionZoneDefinition, ZoneSegmentDefinition } from '../../types/game/advancedMissionZone';

// Pure progression helpers over a zone + its segments. No store / React access — callers pass data in.

export function isFinalSegment(zone: MissionZoneDefinition, segment: ZoneSegmentDefinition): boolean {
  return segment.final === true || zone.finalSegmentIds.includes(segment.id);
}

export function getNextSegments(segment: ZoneSegmentDefinition, all: ZoneSegmentDefinition[]): ZoneSegmentDefinition[] {
  return segment.nextSegmentIds
    .map((id) => all.find((s) => s.id === id))
    .filter((s): s is ZoneSegmentDefinition => !!s);
}

// A segment is enterable once it is unlocked (its entry segment-completed conditions are satisfied by the
// completed set, or it has none / only `always`).
export function canEnterSegment(segment: ZoneSegmentDefinition, completedSegmentIds: string[]): boolean {
  return segment.entryConditions.every((c) => {
    if (c.type === 'segment-completed') return completedSegmentIds.includes(c.segmentId);
    return true; // always / non-gating entry conditions
  });
}
