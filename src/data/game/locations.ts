import type { WorldLocation } from '../../types/game/world';

// Seed world — 1 home base + 2 destinations. Abstract coordinates (no real-scale globe). mapPosition is
// 0..100 % for the Batch 2 2D world map.
export const SEED_LOCATIONS: WorldLocation[] = [
  {
    id: 'loc_homebase',
    codename: 'Skyport Home',
    nameZhTW: '天港基地',
    sourceConfidence: 'GameAdaptation',
    kind: 'base',
    isBase: true,
    description: '角色出動的中心基地,有機艙、升降平台與發射通道。',
    coordinate: { x: 0, y: 0, z: 0 },
    mapPosition: { x: 50, y: 50 },
    environment: 'open_sky',
  },
  {
    id: 'loc_brightcity',
    codename: 'Bright City',
    nameZhTW: '亮亮城',
    sourceConfidence: 'GameAdaptation',
    kind: 'city',
    isBase: false,
    description: '熱鬧的小城,街道上總有人在等待包裹。',
    coordinate: { x: 320, y: 0, z: -180 },
    mapPosition: { x: 72, y: 38 },
    environment: 'city',
  },
  {
    id: 'loc_coralisle',
    codename: 'Coral Isle',
    nameZhTW: '珊瑚島',
    sourceConfidence: 'GameAdaptation',
    kind: 'island',
    isBase: false,
    description: '海風強勁的小島,燈塔與沙灘是地標。',
    coordinate: { x: -260, y: 0, z: 220 },
    mapPosition: { x: 30, y: 68 },
    environment: 'coast',
  },
];
