import type { FlightRoute } from '../../types/game/flight';
import { WORLD_PATH_ID, MOUNTAIN_PATH_ID, STORM_PATH_ID } from './worldRoutes';

// Seed — 3 base→destination routes (PDF §批次5). Each follows its own 航道 (editable in 🛣 Tracks), draws
// from a distinct flight-event pool, has flavour/altitude/event segments (0..1 along it) ending in an
// `approach` band, and a per-route environment override. All Edit-Mode editable + resettable (🧭 Routes /
// 🌦 Environment).
export const SEED_ROUTES: FlightRoute[] = [
  {
    id: 'route_home_sunnyharbor',
    name: 'Skyport → Sunny Harbor',
    fromLocationId: 'loc_homebase',
    toLocationId: 'loc_sunnyharbor',
    virtualDistance: 16000,
    estimatedFlightSec: 600,
    weather: 'clear',
    difficulty: 'easy',
    backgroundEnv: 'open_sky',
    pathId: WORLD_PATH_ID,
    eventPoolIds: ['fe_cloud_hole', 'fe_rainbow', 'fe_energy', 'fe_stunt_ring', 'fe_collectible', 'fe_radio', 'fe_updraft'],
    approachStartU: 0.85,
    segments: [
      { id: 'sh_cloud', kind: 'cloud', startU: 0.0, endU: 0.3, cloudDensity: 1.3, allowedEventKinds: ['cloud_hole', 'collectible', 'radio'], eventDensity: 1 },
      { id: 'sh_collect', kind: 'collectible', startU: 0.3, endU: 0.55, allowedEventKinds: ['collectible', 'energy_refill', 'rainbow'], eventDensity: 1.2 },
      { id: 'sh_stunt', kind: 'stunt', startU: 0.55, endU: 0.8, allowedEventKinds: ['stunt_ring', 'updraft', 'collectible'], eventDensity: 1.3 },
      { id: 'sh_approach', kind: 'approach', startU: 0.85, endU: 1.0, allowedEventKinds: ['radio'], eventDensity: 0.5 },
    ],
    editorEnvironment: { skyTop: '#3f8fe0', skyBottom: '#dff0ff', cloudDensity: 1, weather: 'clear' },
  },
  {
    id: 'route_home_mountaintown',
    name: 'Skyport → Mountain Festival Town',
    fromLocationId: 'loc_homebase',
    toLocationId: 'loc_mountaintown',
    virtualDistance: 14000,
    estimatedFlightSec: 540,
    weather: 'wind',
    difficulty: 'normal',
    backgroundEnv: 'mountain',
    pathId: MOUNTAIN_PATH_ID,
    eventPoolIds: ['fe_crosswind', 'fe_cloud_hole', 'fe_birds', 'fe_collectible', 'fe_updraft', 'fe_radio', 'fe_formation'],
    approachStartU: 0.85,
    segments: [
      { id: 'mt_cloud', kind: 'cloud', startU: 0.0, endU: 0.25, cloudDensity: 1.5, allowedEventKinds: ['cloud_hole', 'collectible'], eventDensity: 1 },
      { id: 'mt_weather', kind: 'weather', startU: 0.25, endU: 0.55, weather: 'wind', allowedEventKinds: ['crosswind', 'birds', 'updraft'], eventDensity: 1.2 },
      { id: 'mt_landmark', kind: 'landmark', startU: 0.55, endU: 0.78, allowedEventKinds: ['collectible', 'formation', 'radio'], eventDensity: 1 },
      { id: 'mt_approach', kind: 'approach', startU: 0.85, endU: 1.0, allowedEventKinds: ['radio'], eventDensity: 0.5 },
    ],
    editorEnvironment: { skyTop: '#5a86b8', skyBottom: '#cfe0ee', fogColor: '#cdd8e6', cloudDensity: 1.4, weather: 'cloudy' },
  },
  {
    id: 'route_home_stormcoast',
    name: 'Skyport → Storm Coast',
    fromLocationId: 'loc_homebase',
    toLocationId: 'loc_stormcoast',
    virtualDistance: 13000,
    estimatedFlightSec: 520,
    weather: 'storm',
    difficulty: 'hard',
    backgroundEnv: 'coast',
    pathId: STORM_PATH_ID,
    eventPoolIds: ['fe_storm', 'fe_lightning', 'fe_crosswind', 'fe_branch', 'fe_radio', 'fe_energy'],
    approachStartU: 0.85,
    segments: [
      { id: 'sc_calm', kind: 'calm', startU: 0.0, endU: 0.2, allowedEventKinds: ['radio', 'energy_refill'], eventDensity: 0.6 },
      { id: 'sc_weather', kind: 'weather', startU: 0.2, endU: 0.55, weather: 'storm', cloudDensity: 1.8, allowedEventKinds: ['storm', 'lightning', 'crosswind'], eventDensity: 1.4 },
      { id: 'sc_branch', kind: 'stunt', startU: 0.55, endU: 0.82, allowedEventKinds: ['branch', 'crosswind', 'energy_refill'], eventDensity: 1 },
      { id: 'sc_approach', kind: 'approach', startU: 0.85, endU: 1.0, allowedEventKinds: ['radio'], eventDensity: 0.5 },
    ],
    editorEnvironment: { skyTop: '#3a4656', skyBottom: '#8a98a8', fogColor: '#9aa6b4', cloudDensity: 1.9, weather: 'storm' },
  },
];
