import type { SourceConfidence } from '../sourceConfidence';
import type { DialogueCondition } from '../dialogue';

// A 3D anchor in the abstract world (NOT a real-scale globe — see PDF "不要建立真實比例地球").
export interface WorldCoordinate {
  x: number;
  y: number;
  z: number;
}

export type LocationKind = 'base' | 'city' | 'island' | 'mountain' | 'harbor' | 'desert' | 'forest' | 'sky';
export const LOCATION_KINDS: readonly LocationKind[] = [
  'base',
  'city',
  'island',
  'mountain',
  'harbor',
  'desert',
  'forest',
  'sky',
];

export interface WorldLocation {
  id: string;
  codename: string;
  name: string;
  sourceConfidence: SourceConfidence;
  kind: LocationKind;
  isBase: boolean;
  description: string;
  coordinate: WorldCoordinate; // 3D world anchor
  mapPosition: { x: number; y: number }; // 0..100 percentage — for the 2D/SVG world map
  environment?: string; // biome / background hint
  modelAssetId?: string; // optional GLB landmark for the location
  // ── map system (Batch 3) ──
  regionId?: string; // grouping on the map (Region.id)
  unlocked?: boolean; // false = manual HARD lock (overrides conditions); default true
  order?: number; // sort order within its region
  // ── progress-driven unlock (evaluated live) ──
  requiredMissionIds?: string[]; // unlock once these missions are complete (mission:<id>:done flags)
  unlockConditions?: DialogueCondition[]; // general gate (world flag / quest / trust / level …) — ALL must pass
}
