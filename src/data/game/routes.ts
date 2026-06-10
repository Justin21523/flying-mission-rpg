import type { FlightRoute } from '../../types/game/flight';

// Seed — one base→destination route. eventPoolIds is the shell the Batch 5 flight-event director fills.
export const SEED_ROUTES: FlightRoute[] = [
  {
    id: 'route_home_brightcity',
    name: 'Skyport → Bright City',
    fromLocationId: 'loc_homebase',
    toLocationId: 'loc_brightcity',
    virtualDistance: 1000,
    estimatedFlightSec: 180,
    weather: 'clear',
    difficulty: 'easy',
    backgroundEnv: 'open_sky',
    eventPoolIds: [],
  },
];
