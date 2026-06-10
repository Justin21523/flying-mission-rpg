// Weather + difficulty are shared by flight routes and missions.
export type WeatherKind = 'clear' | 'cloudy' | 'rain' | 'storm' | 'wind' | 'fog';
export const WEATHER_KINDS: readonly WeatherKind[] = ['clear', 'cloudy', 'rain', 'storm', 'wind', 'fog'];

export type FlightDifficulty = 'easy' | 'normal' | 'hard';
export const FLIGHT_DIFFICULTIES: readonly FlightDifficulty[] = ['easy', 'normal', 'hard'];

export type RouteSegmentKind = 'cloud' | 'weather' | 'landmark' | 'stunt' | 'approach';
export const ROUTE_SEGMENT_KINDS: readonly RouteSegmentKind[] = ['cloud', 'weather', 'landmark', 'stunt', 'approach'];

// A stretch of the route (0..1 along it) with a flavour — denser clouds, a weather band, a landmark, a
// stunt-ring run, or the destination approach.
export interface RouteSegment {
  id: string;
  kind: RouteSegmentKind;
  startU: number; // 0..1 along the route
  endU: number;
  weather?: WeatherKind;
  cloudDensity?: number; // ×1 baseline
}

// An extendable, segmented base→destination route. Distances are abstract units, not real km. `pathId`
// is the 航道 curve in editorPathStore (authored in the 🛣 Tracks tab); `eventPoolIds` selects which
// flight events the director may spawn.
export interface FlightRoute {
  id: string;
  name: string;
  fromLocationId: string;
  toLocationId: string;
  virtualDistance: number;
  estimatedFlightSec: number;
  weather: WeatherKind;
  difficulty: FlightDifficulty;
  backgroundEnv: string;
  eventPoolIds: string[];
  pathId?: string; // editorPathStore path the craft follows
  segments?: RouteSegment[];
}
