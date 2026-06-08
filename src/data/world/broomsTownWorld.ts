import type { District, WorldArea } from '../../types/world';

// POLI RPG — Brooms Town organised into themed districts, with the existing 8 areas plus 5 new ones so
// every district has more than one area (the user wants 每個區有多個 area). Seeds editorWorldStore; fully
// editable in the 🗺 World tab afterward. GameAdaptation: layout designed for playability, not canon.
//
// Connections are normalised to be symmetric by getAllAreas(), so listing one direction is enough.

const SPAWN = { x: 0, y: 3, z: 0 };

export const BROOMS_TOWN_WORLD_AREAS: WorldArea[] = [
  // 一般區 General
  { id: 'rescue_hq', name: 'Rescue HQ', districtId: 'district_general', biome: 'campus', connectedAreaIds: ['main_road', 'central_plaza'], spawnPoint: SPAWN },
  { id: 'central_plaza', name: 'Central Plaza', districtId: 'district_general', biome: 'campus', connectedAreaIds: ['rescue_hq', 'charging_station'], spawnPoint: SPAWN },
  { id: 'school_district', name: 'School District', districtId: 'district_general', biome: 'campus', connectedAreaIds: ['charging_station', 'forest_edge'], spawnPoint: SPAWN },

  // 商業區 Commercial
  { id: 'main_road', name: 'Main Road', districtId: 'district_commercial', biome: 'city', connectedAreaIds: ['rescue_hq', 'harbor_front', 'commercial_mall'], spawnPoint: SPAWN },
  { id: 'commercial_mall', name: 'Shopping Mall', districtId: 'district_commercial', biome: 'shoppingStreet', connectedAreaIds: ['main_road'], spawnPoint: SPAWN },

  // 住宅區 Residential
  { id: 'charging_station', name: 'Charging Station', districtId: 'district_residential', biome: 'residential', connectedAreaIds: ['central_plaza', 'school_district', 'residential_lane'], spawnPoint: SPAWN },
  { id: 'residential_lane', name: 'Residential Lane', districtId: 'district_residential', biome: 'residential', connectedAreaIds: ['charging_station'], spawnPoint: SPAWN },

  // 海岸區 Coast
  { id: 'harbor_front', name: 'Harbor Front', districtId: 'district_coast', biome: 'coast', connectedAreaIds: ['main_road', 'construction_site', 'coast_beach'], spawnPoint: SPAWN },
  { id: 'coast_beach', name: 'Sunny Beach', districtId: 'district_coast', biome: 'coast', connectedAreaIds: ['harbor_front'], spawnPoint: SPAWN },

  // 工業區 Industrial
  { id: 'construction_site', name: 'Construction Site', districtId: 'district_industrial', biome: 'industrial', connectedAreaIds: ['harbor_front', 'forest_edge', 'industrial_yard'], spawnPoint: SPAWN },
  { id: 'industrial_yard', name: 'Industrial Yard', districtId: 'district_industrial', biome: 'industrial', connectedAreaIds: ['construction_site', 'desert_outpost'], spawnPoint: SPAWN },

  // 森林區 Forest
  { id: 'forest_edge', name: 'Forest Edge', districtId: 'district_forest', biome: 'forest', connectedAreaIds: ['school_district', 'construction_site'], spawnPoint: SPAWN },

  // 沙漠區 Desert
  { id: 'desert_outpost', name: 'Desert Outpost', districtId: 'district_desert', biome: 'desert', connectedAreaIds: ['industrial_yard'], spawnPoint: SPAWN },
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
