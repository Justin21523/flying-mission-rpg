import type { LevelLayoutDefinition } from '../../types/levelTypes';
import type { ValidationResult } from '../../types/stageProgressionTypes';

export function validateLevelLayout(layout: LevelLayoutDefinition): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const segmentIds = new Set(layout.segmentIds);
  if (!segmentIds.has(layout.startSegmentId)) errors.push(`${layout.id}: startSegmentId does not exist.`);
  for (const id of layout.finalSegmentIds) if (!segmentIds.has(id)) errors.push(`${layout.id}: final segment ${id} does not exist.`);
  for (const region of layout.spawnRegions) if (!segmentIds.has(region.segmentId)) errors.push(`${layout.id}: spawn region ${region.id} references missing segment ${region.segmentId}.`);
  for (const marker of layout.objectiveMarkers) if (!segmentIds.has(marker.segmentId)) errors.push(`${layout.id}: marker ${marker.id} references missing segment ${marker.segmentId}.`);
  if (!layout.segmentIds.length) errors.push(`${layout.id}: segmentIds cannot be empty.`);
  return { ok: errors.length === 0, errors, warnings };
}
