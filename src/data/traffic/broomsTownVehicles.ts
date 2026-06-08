import type { VehicleDefinition } from '../../types/traffic';

// POLI RPG — Brooms Town NPC vehicle definitions.
// Roy's patrol car is OfficialConfirmed (he drives in the show).
// Civilian vehicles are GameAdaptation (town needs traffic, no canon source).
export const POLI_VEHICLES: VehicleDefinition[] = [
  {
    id: 'vehicle_roy_patrol',
    name: 'Roy Patrol Car',
    nameZhTW: '羅伊巡邏車',
    areaId: 'main_road',
    pathId: 'path_main_road',
    speed: 4.0,
    initialProgress: 0.0,
    color: '#2255cc',
    bodySize: [1.4, 0.7, 2.4],
    sourceConfidence: 'OfficialConfirmed',
  },
  {
    id: 'vehicle_harbor_truck',
    name: 'Harbor Truck',
    nameZhTW: '港口貨車',
    areaId: 'harbor_front',
    pathId: 'path_harbor',
    speed: 3.0,
    initialProgress: 0.0,
    color: '#aa6622',
    bodySize: [1.8, 1.1, 3.0],
    sourceConfidence: 'GameAdaptation',
  },
  {
    id: 'vehicle_school_bus',
    name: 'School Bus',
    nameZhTW: '校車',
    areaId: 'school_district',
    pathId: 'path_school',
    speed: 2.5,
    initialProgress: 0.0,
    color: '#ffcc00',
    bodySize: [2.0, 1.3, 4.5],
    sourceConfidence: 'GameAdaptation',
  },
];
