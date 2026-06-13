import type { FlightEventKind } from './flightEvent';
import type { FlightTimelineTrack } from './flightTimeline';

// Weather + difficulty are shared by flight routes and missions.
export type WeatherKind = 'clear' | 'cloudy' | 'rain' | 'storm' | 'wind' | 'fog';
export const WEATHER_KINDS: readonly WeatherKind[] = ['clear', 'cloudy', 'rain', 'storm', 'wind', 'fog'];

export type FlightDifficulty = 'easy' | 'normal' | 'hard' | 'expert';
export const FLIGHT_DIFFICULTIES: readonly FlightDifficulty[] = ['easy', 'normal', 'hard', 'expert'];

export type RouteSegmentKind = 'cloud' | 'weather' | 'landmark' | 'stunt' | 'collectible' | 'calm' | 'approach';
export const ROUTE_SEGMENT_KINDS: readonly RouteSegmentKind[] = ['cloud', 'weather', 'landmark', 'stunt', 'collectible', 'calm', 'approach'];

// A stretch of the route (0..1 along it) with a flavour — denser clouds, a weather band, a landmark, a
// stunt-ring run, collectibles, a calm stretch, or the destination approach. `allowedEventKinds` restricts
// which events the director may spawn while the craft is inside this band (empty = inherit the route pool);
// `eventDensity` scales how often, and `min/maxAltitude` + `wind` colour the segment.
export interface RouteSegment {
  id: string;
  kind: RouteSegmentKind;
  startU: number; // 0..1 along the route
  endU: number;
  weather?: WeatherKind;
  cloudDensity?: number; // ×1 baseline
  allowedEventKinds?: FlightEventKind[]; // empty/undef = inherit the route's event pool
  eventDensity?: number; // ×1 baseline spawn frequency while in this segment
  minAltitude?: number;
  maxAltitude?: number;
  wind?: [number, number, number];
}

// Named sky looks — fill sensible sky/fog colours; manual colour fields still override per-field.
export type SkyPreset = 'clear' | 'cloudy' | 'sunset' | 'night' | 'storm';
export const SKY_PRESETS: readonly SkyPreset[] = ['clear', 'cloudy', 'sunset', 'night', 'storm'];

// Per-route environment override (the editorEnvironment idea, applied to the world-flight sky/fog/clouds).
export interface RouteEnvironmentOverride {
  skyPreset?: SkyPreset;
  skyTop?: string;
  skyBottom?: string;
  fogColor?: string;
  fogNear?: number;
  fogFar?: number; // huge / 0 = no fog
  ambientIntensity?: number;
  sunIntensity?: number;
  cloudDensity?: number; // ×1 baseline cloud count
  weather?: WeatherKind;
  backgroundPresetId?: string;
}

// An extendable, segmented base→destination route. Distances are abstract units, not real km. `pathId`
// is the 航道 curve in editorPathStore (authored in the 🛣 Tracks tab); `eventPoolIds` selects which
// flight events the director may spawn; `segments` add flavour/altitude/event bands along 0..1.
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
  returnPathId?: string; // optional homebound path; empty = reuse outbound path
  returnPathDirection?: 'forward' | 'reverse'; // when reusing a path, reverse makes u=0 start at the destination
  segments?: RouteSegment[];
  editorEnvironment?: RouteEnvironmentOverride;
  approachStartU?: number; // where the approach band begins (default 0.85)
  timeTracks?: FlightTimelineTrack[]; // per-u Edit Mode craft/camera keyframes for this route
}
