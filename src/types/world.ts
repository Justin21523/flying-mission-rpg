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

// A WorldArea is a KitArea with its owning district + an explicit biome (a BIOME_THEMES key).
export interface WorldArea extends KitArea {
  districtId?: string;
  biome?: string; // a BIOME_THEMES key; falls back to ambientTheme / inferred
}
