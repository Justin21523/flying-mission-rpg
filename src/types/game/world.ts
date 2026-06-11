import type { SourceConfidence } from '../sourceConfidence';

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
  mapPosition: { x: number; y: number }; // 0..100 percentage — for the Batch 2 2D/SVG world map
  environment?: string; // biome / background hint
  modelAssetId?: string; // optional GLB landmark for the location
}
