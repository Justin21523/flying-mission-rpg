import type { FlightTuning } from '../../types/game/flightControl';

// Default flight-handling tuning (editable in the 🛩 Flight tab). Per-character stats scale speed/turn.
export const DEFAULT_FLIGHT_TUNING: FlightTuning = {
  maxSpeed: 60,
  cruiseSpeed: 22,
  stallSpeed: 9,
  throttleAccel: 32,
  brakeDecel: 26,
  pitchRate: 1.0,
  yawRate: 0.8,
  rollRate: 1.8,
  turnSmooth: 6,
  autoLevel: 1.6,
  fovBase: 60,
  fovMax: 88,
  camDistance: 9,
  camHeight: 3,
  camPullback: 4,
  rollFollow: 0.45,
  boundaryRadius: 240,
};
