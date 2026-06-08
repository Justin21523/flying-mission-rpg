export type TimeSlot = 'dawn' | 'day' | 'evening' | 'night';

export interface NpcSchedule {
  characterId: string;
  slots: Record<TimeSlot, string>; // → areaId for each time slot
  positions: Partial<Record<string, [number, number, number]>>; // areaId → world pos
}

// Poli is excluded — he is the player character.
export const BROOMS_TOWN_SCHEDULES: NpcSchedule[] = [
  {
    characterId: 'roy',
    slots: { dawn: 'rescue_hq', day: 'main_road', evening: 'rescue_hq', night: 'rescue_hq' },
    positions: {
      rescue_hq: [-4, 0, 3],
      main_road: [4, 0, -2],
    },
  },
  {
    characterId: 'helly',
    slots: { dawn: 'rescue_hq', day: 'forest_edge', evening: 'rescue_hq', night: 'rescue_hq' },
    positions: {
      rescue_hq: [0, 0, -4],
      forest_edge: [2, 0, -1],
    },
  },
  {
    characterId: 'spoki',
    slots: { dawn: 'rescue_hq', day: 'central_plaza', evening: 'main_road', night: 'rescue_hq' },
    positions: {
      rescue_hq: [4, 0, 3],
      central_plaza: [-2, 0, 3],
      main_road: [-3, 0, 2],
    },
  },
  {
    characterId: 'jin',
    slots: { dawn: 'rescue_hq', day: 'rescue_hq', evening: 'rescue_hq', night: 'rescue_hq' },
    positions: {
      rescue_hq: [-4, 0, -3],
    },
  },
  {
    characterId: 'mayor_lee',
    slots: { dawn: 'central_plaza', day: 'central_plaza', evening: 'central_plaza', night: 'charging_station' },
    positions: {
      central_plaza: [0, 0, 0],
      charging_station: [2, 0, 2],
    },
  },
  {
    characterId: 'teacher_mi',
    slots: { dawn: 'charging_station', day: 'school_district', evening: 'central_plaza', night: 'charging_station' },
    positions: {
      charging_station: [-2, 0, 0],
      school_district: [3, 0, -3],
      central_plaza: [3, 0, -2],
    },
  },
  {
    characterId: 'dr_kim',
    slots: { dawn: 'central_plaza', day: 'central_plaza', evening: 'central_plaza', night: 'charging_station' },
    positions: {
      central_plaza: [4, 0, 0],
      charging_station: [0, 0, -2],
    },
  },
  {
    characterId: 'harbor_worker',
    slots: { dawn: 'harbor_front', day: 'harbor_front', evening: 'harbor_front', night: 'harbor_front' },
    positions: {
      harbor_front: [0, 0, 3],
    },
  },
  {
    characterId: 'site_foreman',
    slots: { dawn: 'construction_site', day: 'construction_site', evening: 'construction_site', night: 'construction_site' },
    positions: {
      construction_site: [0, 0, -3],
    },
  },
];
