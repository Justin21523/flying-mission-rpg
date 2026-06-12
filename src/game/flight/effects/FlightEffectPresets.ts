import type { FlightPolishPreset } from '../../../types/game/flightPolish';
import type { SkyPreset } from '../../../types/game/flight';

// Batch 12 — seed flight polish presets, one per route mood. Picked by the active route's sky preset so
// each leg has a coherent look; falls back to sunny.

export const SUNNY_FLIGHT_POLISH: FlightPolishPreset = {
  id: 'sunny-flight-polish',
  label: 'Sunny Flight',
  speedLine: { color: '#ffffff', minSpeedForLines: 0.25, maxIntensitySpeed: 0.9, lineCount: 90, lineLength: 1, opacity: 0.55, radialSpread: 1, boostMultiplier: 1.5 },
  engineTrail: { color: '#bfe4ff', length: 1 },
  cloudBreak: { particleCount: 18, burstScale: 1 },
  weatherTransitionSpeed: 2.5,
  colorGradeTint: '#dff0ff',
  cloudDensityMultiplier: 1,
  landmarkVisibilityDistance: 1200,
};

export const STORM_FLIGHT_POLISH: FlightPolishPreset = {
  id: 'storm-flight-polish',
  label: 'Storm Flight',
  speedLine: { color: '#cdd8e6', minSpeedForLines: 0.2, maxIntensitySpeed: 0.85, lineCount: 110, lineLength: 1.2, opacity: 0.7, radialSpread: 1.15, boostMultiplier: 1.6 },
  engineTrail: { color: '#9fb6cc', length: 1.2 },
  cloudBreak: { particleCount: 26, burstScale: 1.25 },
  weatherTransitionSpeed: 3.5,
  colorGradeTint: '#8a96a4',
  cloudDensityMultiplier: 1.4,
  landmarkVisibilityDistance: 800,
};

export const SUNSET_FLIGHT_POLISH: FlightPolishPreset = {
  id: 'sunset-flight-polish',
  label: 'Sunset Flight',
  speedLine: { color: '#ffe6c2', minSpeedForLines: 0.25, maxIntensitySpeed: 0.9, lineCount: 90, lineLength: 1.05, opacity: 0.55, radialSpread: 1, boostMultiplier: 1.5 },
  engineTrail: { color: '#ffd6a0', length: 1.1 },
  cloudBreak: { particleCount: 20, burstScale: 1.1 },
  weatherTransitionSpeed: 3,
  colorGradeTint: '#f0b27a',
  cloudDensityMultiplier: 1.1,
  landmarkVisibilityDistance: 1000,
};

export const ALL_FLIGHT_POLISH_PRESETS: FlightPolishPreset[] = [SUNNY_FLIGHT_POLISH, STORM_FLIGHT_POLISH, SUNSET_FLIGHT_POLISH];

// Map a sky preset to the matching polish preset id (so route mood drives the look).
export const SKY_TO_FLIGHT_POLISH: Record<SkyPreset, string> = {
  clear: 'sunny-flight-polish',
  cloudy: 'sunny-flight-polish',
  sunset: 'sunset-flight-polish',
  night: 'storm-flight-polish',
  storm: 'storm-flight-polish',
};
