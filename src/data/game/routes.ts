import type { FlightRoute } from '../../types/game/flight';
import { WORLD_PATH_ID } from './worldRoutes';
import { SEED_FLIGHT_EVENTS } from './flightEvents';

// Seed — one base→destination route. Follows the WORLD_PATH 航道 (editable in 🛣 Tracks) and draws from
// the full flight-event pool. Segments give the route flavour bands (0..1 along it).
export const SEED_ROUTES: FlightRoute[] = [
  {
    id: 'route_home_brightcity',
    name: 'Skyport → Bright City',
    fromLocationId: 'loc_homebase',
    toLocationId: 'loc_brightcity',
    virtualDistance: 16000,
    estimatedFlightSec: 600,
    weather: 'clear',
    difficulty: 'easy',
    backgroundEnv: 'open_sky',
    pathId: WORLD_PATH_ID,
    eventPoolIds: SEED_FLIGHT_EVENTS.map((e) => e.id),
    segments: [
      { id: 'seg_clouds', kind: 'cloud', startU: 0.0, endU: 0.35, cloudDensity: 1.4 },
      { id: 'seg_weather', kind: 'weather', startU: 0.35, endU: 0.6, weather: 'cloudy' },
      { id: 'seg_stunt', kind: 'stunt', startU: 0.6, endU: 0.8 },
      { id: 'seg_approach', kind: 'approach', startU: 0.85, endU: 1.0 },
    ],
  },
];
