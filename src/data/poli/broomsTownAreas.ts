import type { KitArea } from '../areas';

// POLI RPG — Brooms Town district definitions.
// All 8 areas are GameAdaptation (no official city map exists; layout designed for playability).
// Connections are bidirectional and form a single RING through all 8 areas (no dead-ends) so the
// player can complete a loop patrol via the travel gates:
//   rescue_hq ↔ main_road ↔ harbor_front ↔ construction_site ↔ forest_edge ↔ school_district ↔
//   charging_station ↔ central_plaza ↔ rescue_hq.
// Biomes reuse existing kit types — no new BiomeType required.
export const BROOMS_TOWN_AREAS: KitArea[] = [
  {
    id: 'rescue_hq',
    name: 'Rescue HQ',
    ambientTheme: 'campus',
    connectedAreaIds: ['main_road', 'central_plaza'],
    spawnPoint: { x: 0, y: 3, z: 0 },
  },
  {
    id: 'main_road',
    name: 'Main Road',
    ambientTheme: 'city',
    connectedAreaIds: ['rescue_hq', 'harbor_front'],
    spawnPoint: { x: 0, y: 3, z: 0 },
  },
  {
    id: 'central_plaza',
    name: 'Central Plaza',
    ambientTheme: 'campus',
    connectedAreaIds: ['rescue_hq', 'charging_station'],
    spawnPoint: { x: 0, y: 3, z: 0 },
  },
  {
    id: 'charging_station',
    name: 'Charging Station',
    ambientTheme: 'residential',
    connectedAreaIds: ['central_plaza', 'school_district'],
    spawnPoint: { x: 0, y: 3, z: 0 },
  },
  {
    id: 'school_district',
    name: 'School District',
    ambientTheme: 'campus',
    connectedAreaIds: ['charging_station', 'forest_edge'],
    spawnPoint: { x: 0, y: 3, z: 0 },
  },
  {
    id: 'harbor_front',
    name: 'Harbor Front',
    ambientTheme: 'coast',
    connectedAreaIds: ['main_road', 'construction_site'],
    spawnPoint: { x: 0, y: 3, z: 0 },
  },
  {
    id: 'construction_site',
    name: 'Construction Site',
    ambientTheme: 'port',
    connectedAreaIds: ['harbor_front', 'forest_edge'],
    spawnPoint: { x: 0, y: 3, z: 0 },
  },
  {
    id: 'forest_edge',
    name: 'Forest Edge',
    ambientTheme: 'forest',
    connectedAreaIds: ['school_district', 'construction_site'],
    spawnPoint: { x: 0, y: 3, z: 0 },
  },
];
