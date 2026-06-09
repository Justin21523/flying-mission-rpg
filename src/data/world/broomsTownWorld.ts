import type { District, WorldArea } from '../../types/world';

// POLI RPG — Brooms Town organised into themed districts, with the existing 8 areas plus 5 new ones so
// every district has more than one area (the user wants 每個區有多個 area). Seeds editorWorldStore; fully
// editable in the 🗺 World tab afterward. GameAdaptation: layout designed for playability, not canon.
//
// Connections are normalised to be symmetric by getAllAreas(), so listing one direction is enough.

const SPAWN = { x: 0, y: 3, z: 0 };
const SIZE = 40; // playable half-extent per area; edges sit at ±40 (editable in the 🗺 World tab)

// Edges form a reciprocal grid (north=-z, south=+z, east=+x, west=-x). Walking off an edge with a
// neighbour transitions there; connectedAreaIds is derived from edges by getAllAreas().
export const BROOMS_TOWN_WORLD_AREAS: WorldArea[] = [
  // 一般區 General
  { id: 'rescue_hq', name: 'Rescue HQ', districtId: 'district_general', biome: 'campus', size: SIZE, spawnPoint: SPAWN, edges: { east: 'main_road', south: 'central_plaza' } },
  { id: 'central_plaza', name: 'Central Plaza', districtId: 'district_general', biome: 'campus', size: SIZE, spawnPoint: SPAWN, edges: { north: 'rescue_hq', south: 'charging_station' } },
  { id: 'school_district', name: 'School District', districtId: 'district_general', biome: 'campus', size: SIZE, spawnPoint: SPAWN, edges: { west: 'charging_station', south: 'forest_edge' } },

  // 商業區 Commercial
  { id: 'main_road', name: 'Main Road', districtId: 'district_commercial', biome: 'city', size: SIZE, spawnPoint: SPAWN, edges: { west: 'rescue_hq', east: 'harbor_front', north: 'commercial_mall' } },
  { id: 'commercial_mall', name: 'Shopping Mall', districtId: 'district_commercial', biome: 'shoppingStreet', size: SIZE, spawnPoint: SPAWN, edges: { south: 'main_road' } },

  // 住宅區 Residential
  { id: 'charging_station', name: 'Charging Station', districtId: 'district_residential', biome: 'residential', size: SIZE, spawnPoint: SPAWN, edges: { north: 'central_plaza', east: 'school_district', west: 'residential_lane' } },
  { id: 'residential_lane', name: 'Residential Lane', districtId: 'district_residential', biome: 'residential', size: SIZE, spawnPoint: SPAWN, edges: { east: 'charging_station' } },

  // 海岸區 Coast
  { id: 'harbor_front', name: 'Harbor Front', districtId: 'district_coast', biome: 'coast', size: SIZE, spawnPoint: SPAWN, edges: { west: 'main_road', south: 'construction_site', east: 'coast_beach' } },
  { id: 'coast_beach', name: 'Sunny Beach', districtId: 'district_coast', biome: 'coast', size: SIZE, spawnPoint: SPAWN, edges: { west: 'harbor_front' } },

  // 工業區 Industrial
  { id: 'construction_site', name: 'Construction Site', districtId: 'district_industrial', biome: 'industrial', size: SIZE, spawnPoint: SPAWN, edges: { north: 'harbor_front', west: 'forest_edge', south: 'industrial_yard' } },
  { id: 'industrial_yard', name: 'Industrial Yard', districtId: 'district_industrial', biome: 'industrial', size: SIZE, spawnPoint: SPAWN, edges: { north: 'construction_site', south: 'desert_outpost' } },

  // 森林區 Forest
  { id: 'forest_edge', name: 'Forest Edge', districtId: 'district_forest', biome: 'forest', size: SIZE, spawnPoint: SPAWN, edges: { north: 'school_district', east: 'construction_site' } },

  // 沙漠區 Desert
  { id: 'desert_outpost', name: 'Desert Outpost', districtId: 'district_desert', biome: 'desert', size: SIZE, spawnPoint: SPAWN, edges: { north: 'industrial_yard' } },
];

export const BROOMS_TOWN_DISTRICTS: District[] = [
  { id: 'district_general', name: 'General District', category: 'general', areaIds: ['rescue_hq', 'central_plaza', 'school_district'] },
  { id: 'district_commercial', name: 'Commercial District', category: 'commercial', areaIds: ['main_road', 'commercial_mall'] },
  { id: 'district_residential', name: 'Residential District', category: 'residential', areaIds: ['charging_station', 'residential_lane'] },
  { id: 'district_coast', name: 'Coast District', category: 'coast', areaIds: ['harbor_front', 'coast_beach'] },
  { id: 'district_industrial', name: 'Industrial District', category: 'industrial', areaIds: ['construction_site', 'industrial_yard'] },
  { id: 'district_forest', name: 'Forest District', category: 'forest', areaIds: ['forest_edge'] },
  { id: 'district_desert', name: 'Desert District', category: 'desert', areaIds: ['desert_outpost'] },
];
