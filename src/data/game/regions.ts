import type { Region } from '../../types/game/region';

// Seed regions — two starter groups for the world map. Locations reference these via WorldLocation.regionId.
export const SEED_REGIONS: Region[] = [
  { id: 'reg_home_waters', name: 'Home Waters', color: '#38bdf8', description: 'The base and the friendly coast nearby.', order: 0, unlocked: true },
  { id: 'reg_far_reaches', name: 'Far Reaches', color: '#f59e0b', description: 'Distant towns, peaks and storm coasts.', order: 1, unlocked: true },
];
