import { objKey } from '../edit/sceneEditMerge';

// Stable sceneEditStore key for a destination part (area 'destination', kind 'structure' — an existing
// EditKind, like base/exterior parts).
export function destinationPartKey(id: string): string {
  return objKey('destination', 'structure', id);
}
