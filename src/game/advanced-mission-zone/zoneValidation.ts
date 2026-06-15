import type {
  MissionZoneDefinition,
  ZoneSegmentDefinition,
  ZoneConditionDefinition,
  ZoneValidationResult,
} from '../../types/game/advancedMissionZone';

// Pure validation for a Mission Zone + its segments. Used by the 🎯 Mission Zone editor tab (blocks relying
// on an invalid draft) and by tests. Returns errors (must fix) and warnings (suspicious but allowed).

function conditionRefError(c: ZoneConditionDefinition, segmentIds: Set<string>): string | null {
  switch (c.type) {
    case 'segment-completed':
      return segmentIds.has(c.segmentId) ? null : `references missing segment "${c.segmentId}"`;
    case 'reach-marker':
      return c.radius > 0 ? null : 'reach-marker radius must be > 0';
    case 'wait-seconds':
      return c.seconds > 0 ? null : 'wait-seconds must be > 0';
    default:
      return null;
  }
}

export function validateMissionZone(
  zone: MissionZoneDefinition,
  segments: ZoneSegmentDefinition[],
): ZoneValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!zone.id.trim()) errors.push('Zone id must not be empty.');
  if (!zone.locationId.trim()) warnings.push('Zone has no locationId — it will never auto-route from LANDING.');

  const owned = segments.filter((s) => s.zoneId === zone.id);
  const ownedIds = new Set(owned.map((s) => s.id));

  // segmentIds list references must resolve.
  for (const id of zone.segmentIds) {
    if (!ownedIds.has(id)) errors.push(`segmentIds references "${id}" which is not a segment of this zone.`);
  }
  // Every owned segment should be listed (otherwise it is orphaned / not ordered).
  for (const s of owned) {
    if (!zone.segmentIds.includes(s.id)) warnings.push(`Segment "${s.id}" belongs to the zone but is missing from segmentIds (order).`);
  }

  if (!zone.startSegmentId) errors.push('startSegmentId is required.');
  else if (!ownedIds.has(zone.startSegmentId)) errors.push(`startSegmentId "${zone.startSegmentId}" does not exist.`);

  if (zone.finalSegmentIds.length === 0) errors.push('finalSegmentIds must not be empty.');
  for (const id of zone.finalSegmentIds) {
    if (!ownedIds.has(id)) errors.push(`finalSegmentIds references "${id}" which does not exist.`);
  }

  // Duplicate order numbers → warn (still resolvable, but ambiguous in the editor).
  const orders = new Map<number, number>();
  for (const s of owned) orders.set(s.order, (orders.get(s.order) ?? 0) + 1);
  for (const [order, count] of orders) {
    if (count > 1) warnings.push(`${count} segments share order ${order}.`);
  }

  for (const s of owned) {
    if (s.zoneId !== zone.id) errors.push(`Segment "${s.id}" has zoneId "${s.zoneId}" (expected "${zone.id}").`);
    if (s.completionConditions.length === 0) errors.push(`Segment "${s.id}" has no completion conditions.`);

    for (const nid of s.nextSegmentIds) {
      if (!ownedIds.has(nid)) errors.push(`Segment "${s.id}" nextSegmentIds references missing "${nid}".`);
    }
    // linear zone should have at most one next per segment.
    if (zone.zoneMode === 'linear' && s.nextSegmentIds.length > 1) {
      warnings.push(`Linear zone but segment "${s.id}" has ${s.nextSegmentIds.length} next segments.`);
    }
    if (!s.final && s.nextSegmentIds.length === 0 && !zone.finalSegmentIds.includes(s.id)) {
      warnings.push(`Segment "${s.id}" is a dead end (no next segments and not final).`);
    }

    const markerIds = new Set(s.markers.map((m) => m.id));
    for (const c of [...s.entryConditions, ...s.completionConditions]) {
      const refErr = conditionRefError(c, ownedIds);
      if (refErr) errors.push(`Segment "${s.id}" condition "${c.id}": ${refErr}`);
      if (c.type === 'reach-marker' && !markerIds.has(c.markerId)) {
        errors.push(`Segment "${s.id}" condition "${c.id}" reach-marker references missing marker "${c.markerId}".`);
      }
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}
