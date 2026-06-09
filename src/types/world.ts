import type { KitArea } from '../data/areas';

// POLI RPG — district / world organisation layer on top of the kit's flat area registry.
// A District groups several areas under a themed category (residential, commercial, …). A WorldArea is a
// KitArea plus its district + explicit biome. All editable in the 🗺 World tab (editorWorldStore).

export type DistrictCategory =
  | 'residential'
  | 'commercial'
  | 'industrial'
  | 'general'
  | 'forest'
  | 'desert'
  | 'coast';

export const DISTRICT_CATEGORIES: DistrictCategory[] = [
  'residential', 'commercial', 'industrial', 'general', 'forest', 'desert', 'coast',
];

// Display labels (English; zh-TW reference in comments per the project language rule).
export const DISTRICT_CATEGORY_LABEL: Record<DistrictCategory, string> = {
  residential: 'Residential', // 住宅區
  commercial: 'Commercial',   // 商業區
  industrial: 'Industrial',   // 工業區
  general: 'General',         // 一般區
  forest: 'Forest',          // 森林區
  desert: 'Desert',          // 沙漠區
  coast: 'Coast',            // 海岸區
};

export interface District {
  id: string;
  name: string;
  category: DistrictCategory;
  areaIds: string[];
}

// Map edges — walking off an edge that has a neighbour transitions there (no portal). Convention:
// north = -z, south = +z, east = +x, west = -x. The reciprocal edge is the OPPOSITE one.
export type EdgeDir = 'north' | 'south' | 'east' | 'west';
export const EDGE_DIRS: EdgeDir[] = ['north', 'south', 'east', 'west'];
export const OPPOSITE_EDGE: Record<EdgeDir, EdgeDir> = { north: 'south', south: 'north', east: 'west', west: 'east' };
export interface AreaEdges { north?: string; south?: string; east?: string; west?: string }

// A WorldArea is a KitArea with its owning district + an explicit biome, plus an editable playable size
// (square half-extent) and per-edge neighbour links for walk-between-areas travel.
export interface WorldArea extends KitArea {
  districtId?: string;
  biome?: string;   // a BIOME_THEMES key; falls back to ambientTheme / inferred
  size?: number;    // playable half-extent (edges sit at ±size); default DEFAULT_AREA_SIZE
  edges?: AreaEdges; // neighbour area id per edge (drives edge-walk transitions + connectedAreaIds)
}

export const DEFAULT_AREA_SIZE = 40;
