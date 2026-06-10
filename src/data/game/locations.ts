import type { WorldLocation } from '../../types/game/world';

// Seed world — 1 home base + 2 destinations. Abstract coordinates (no real-scale globe). mapPosition is
// 0..100 % for the Batch 2 2D world map. All display text is English.
export const SEED_LOCATIONS: WorldLocation[] = [
  {
    id: 'loc_homebase',
    codename: 'Skyport Home',
    name: 'Skyport Home Base',
    sourceConfidence: 'GameAdaptation',
    kind: 'base',
    isBase: true,
    description: 'The central base for dispatch — hangar, lift platform and launch tunnel.',
    coordinate: { x: 0, y: 0, z: 0 },
    mapPosition: { x: 50, y: 50 },
    environment: 'open_sky',
  },
  {
    id: 'loc_brightcity',
    codename: 'Bright City',
    name: 'Bright City',
    sourceConfidence: 'GameAdaptation',
    kind: 'city',
    isBase: false,
    description: 'A busy little city where someone is always waiting on a parcel.',
    coordinate: { x: 320, y: 0, z: -180 },
    mapPosition: { x: 72, y: 38 },
    environment: 'city',
  },
  {
    id: 'loc_coralisle',
    codename: 'Coral Isle',
    name: 'Coral Isle',
    sourceConfidence: 'GameAdaptation',
    kind: 'island',
    isBase: false,
    description: 'A windy little island; its lighthouse and beaches are the landmarks.',
    coordinate: { x: -260, y: 0, z: 220 },
    mapPosition: { x: 30, y: 68 },
    environment: 'coast',
  },
];
