// Weather + difficulty are shared by flight routes and missions.
export type WeatherKind = 'clear' | 'cloudy' | 'rain' | 'storm' | 'wind' | 'fog';
export const WEATHER_KINDS: readonly WeatherKind[] = ['clear', 'cloudy', 'rain', 'storm', 'wind', 'fog'];

export type FlightDifficulty = 'easy' | 'normal' | 'hard';
export const FLIGHT_DIFFICULTIES: readonly FlightDifficulty[] = ['easy', 'normal', 'hard'];

// An extendable, segmented base→destination route. Distances are abstract units, not real km.
// `eventPoolIds` is a shell the Batch 5 flight-event director will fill.
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
}
